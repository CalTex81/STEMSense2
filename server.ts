import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Tracks models that failed due to 429 quota/resource exhaustion
const blacklistedModels = new Map<string, number>();
const BLACKLIST_DURATION_MS = 10 * 60 * 1000; // 10 minutes cache

// Helper to perform robust calls to Gemini with automatic retries and fallback models
async function robustGenerateContent(params: {
  contents: any;
  config: any;
  primaryModel?: string;
  fallbackModel?: string;
  maxRetries?: number;
}): Promise<any> {
  const modelsToTry = [
    params.primaryModel || "gemini-3.5-flash",
    params.fallbackModel || "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];
  
  // Deduplicate array while maintaining sequence order
  const uniqueModels = Array.from(new Set(modelsToTry));
  const maxRetries = params.maxRetries !== undefined ? params.maxRetries : 2;
  
  const now = Date.now();
  // Filter out any models that are blacklisted due to quota exhaustion
  const activeModels = uniqueModels.filter((modelName) => {
    const blacklistTime = blacklistedModels.get(modelName);
    if (blacklistTime && now - blacklistTime < BLACKLIST_DURATION_MS) {
      console.log(`[Gemini Engine] Skipping rate-limited model ${modelName}`);
      return false;
    }
    return true;
  });

  // Fallback to the whole list if all are blacklisted to avoid empty list
  const modelsToQuery = activeModels.length > 0 ? activeModels : uniqueModels;

  let lastError: any = null;

  for (const modelName of modelsToQuery) {
    console.log(`[Gemini Engine] Attempting generation with model: ${modelName}`);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 500; // 1000ms, 2000ms delay
          console.log(`[Gemini Engine] Retrying ${modelName} - attempt ${attempt}/${maxRetries} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });
        
        console.log(`[Gemini Engine] Success using model: ${modelName}`);
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || "").toLowerCase();
        
        // Use console.log or console.warn for expected retriable/quota issues during fallback attempts
        // so that automated monitors do not misidentify transient rate status as persistent application crashes
        console.warn(`[Gemini Engine] Pivot warning: Model (${modelName}) hit exception on attempt ${attempt}: ${err?.message || err}`);
        
        // If it is a client-side bad request/validation, stop retrying immediately (schema error etc)
        if (errMsg.includes("400") || errMsg.includes("invalid") || errMsg.includes("schema")) {
          throw err;
        }
        
        // If it is resource exhausted or quota error, do NOT waste retry attempts!
        // Immediately break the retry loop and move to the next fallback model!
        if (
          errMsg.includes("429") || 
          errMsg.includes("quota") || 
          errMsg.includes("limit") || 
          errMsg.includes("exhausted")
        ) {
          console.warn(`[Gemini Engine] Quota limit encountered on ${modelName}. Blacklisting temporarily and switching...`);
          blacklistedModels.set(modelName, Date.now());
          break; // break retry loop, moves to the next model in uniqueModels
        }
      }
    }
  }

  // If all models in the fallback chain failed
  const detailedErrorMsg = lastError?.message || lastError || "All service connections exhausted";
  console.error(`[Gemini Engine Failure] All fallback chain models failed:`, detailedErrorMsg);
  throw new Error(
    `All available AI models are temporarily experiencing high demand or quota limits. Please try again in a few moments. (Details: ${detailedErrorMsg})`
  );
}

const app = express();
const PORT = 3000;

// Setup JSON body parsing and form data uploading
app.use(express.json());
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Add simple CORS headers for local/iframe access
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Helper for building custom STEM Prompt
function _build_custom_stem_prompt(customPrompt: string, items: string[], userData: any): string {
  const focus = userData?.learningFocus || "";
  const audience = userData?.audience || "";
  const time_limit = userData?.timeLimitMinutes || "";
  const materials = userData?.materialsAvailable || "";
  const constraints = userData?.constraints || "";

  const userDataBlock = {
    learningFocus: focus,
    audience: audience,
    timeLimitMinutes: time_limit,
    materialsAvailable: materials,
    constraints: constraints,
  };

  return (
    "CUSTOM PROMPT (may override style/content):\n" +
    `${customPrompt}\n\n` +
    "DETECTED OBJECTS (array):\n" +
    `${JSON.stringify(items)}\n\n` +
    "USER DATA / CONSTRAINTS (JSON):\n" +
    `${JSON.stringify(userDataBlock)}\n\n` +
    "INSTRUCTIONS:\n" +
    "- Come up with multiple feasible STEM experiments (3-5) based on the detected objects.\n" +
    "- Each experiment must include: title (name), learning goal, difficulty, estimated time, materials, safety, and step-by-step procedure.\n" +
    "- Use the detected objects explicitly (how they connect to the concept).\n" +
    "- If materials are limited, adapt steps using substitutions.\n" +
    "- Output MUST be valid JSON matching the schema.\n" +
    "- Do not include any extra keys outside the schema.\n" +
    "- Do not include markdown fences in the response text.\n"
  );
}

// Health check endpoints (supporting both frontend and debug checks)
app.get("/health", (req, res) => {
  res.json({ status: "ok", model: "gemini-3.5-flash" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", model: "gemini-3.5-flash" });
});

// Object detection endpoint
// Accepts a file and passes it to Gemini to identify objects with bounding boxes
app.post("/detect", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const base64Data = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const promptText = 
      "You are a computer vision assistant. Identify physical, everyday objects in this image that have STEM " +
      "(science, technology, engineering, math) potential or could be used in science experiments. " +
      "For each object, determine its label/name, confidence level (0.0 to 1.0), and estimated normalized " +
      "bounding box coordinates (x, y, w, h) in the range 0.0 to 1.0 (where x, y is the top-left corner, and w, h is the width and height). " +
      "Return the details strictly in JSON format as required by the schema.";

    const geminiResponse = await robustGenerateContent({
      primaryModel: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  conf: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
                  bbox: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER, description: "Top-left x coordinate (0.0 to 1.0)" },
                      y: { type: Type.NUMBER, description: "Top-left y coordinate (0.0 to 1.0)" },
                      w: { type: Type.NUMBER, description: "Width (0.0 to 1.0)" },
                      h: { type: Type.NUMBER, description: "Height (0.0 to 1.0)" },
                    },
                    required: ["x", "y", "w", "h"],
                  },
                },
                required: ["label", "conf", "bbox"],
              },
            },
          },
          required: ["detections"],
        },
      },
    });

    let cleanText = geminiResponse.text || "{}";
    if (cleanText.includes("```")) {
      cleanText = cleanText.replace(/```json/gi, "").replace(/```/gi, "").trim();
    }
    const parsedData = JSON.parse(cleanText);
    const detections = parsedData.detections || [];

    res.json({
      detections: detections,
      count: detections.length,
    });
  } catch (error: any) {
    console.error("Detect Error:", error);
    res.status(500).json({ error: error.message || "Failed to process image detection" });
  }
});

// Proxy route for /api/detect just in case
app.post("/api/detect", upload.single("file"), async (req, res) => {
  // Redirect to main detect handler
  return res.redirect(307, "/detect");
});

// LLM Analyze endpoint for experiment generation
app.post("/analyze", async (req, res) => {
  try {
    const { provider, customPrompt, items, apiKey, userData } = req.body;

    if (!provider) {
      return res.status(400).json({ error: "provider is required" });
    }
    if (!customPrompt) {
      return res.status(400).json({ error: "customPrompt is required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items must be a non-empty list" });
    }

    const providerType = provider.trim().toLowerCase();
    const prompt = _build_custom_stem_prompt(customPrompt, items, userData || {});

    if (providerType === "gemini") {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }

      const response = await robustGenerateContent({
        primaryModel: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              experiments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    learningGoal: { type: Type.STRING },
                    difficulty: { type: Type.STRING, description: "easy, medium, or hard" },
                    estimatedTimeMinutes: { type: Type.INTEGER },
                    materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                    safetyNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["name", "learningGoal", "difficulty", "estimatedTimeMinutes", "materials", "safetyNotes", "steps"],
                },
              },
            },
            required: ["title", "experiments"],
          },
        },
      });

      let cleanText = response.text || "{}";
      if (cleanText.includes("```")) {
        cleanText = cleanText.replace(/```json/gi, "").replace(/```/gi, "").trim();
      }
      const parsedPlan = JSON.parse(cleanText);
      return res.json({
        experimentPlan: parsedPlan,
        reasoningSummary: "Generated experiments conditioned on the detected objects array and user constraints.",
      });

    } else if (providerType === "deepseek") {
      const activeKey = apiKey || process.env.DEEPSEEK_API_KEY;
      if (!activeKey) {
        return res.status(400).json({ error: "apiKey is required for DeepSeek" });
      }

      const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "You are a helpful STEM tutor and experiment planner. Output raw JSON matching the requested experiment planner schema." },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
        }),
      });

      if (!deepseekResponse.ok) {
        const errText = await deepseekResponse.text();
        return res.status(502).json({ error: `DeepSeek provider error: ${errText}` });
      }

      const jsonResult = await deepseekResponse.json();
      const textOutput = jsonResult.choices[0]?.message?.content || "";

      // Standardize markdown cleaning in case deepseek wrapped in code fences
      const cleanJsonText = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedPlan = JSON.parse(cleanJsonText);

      return res.json({
        experimentPlan: parsedPlan,
        reasoningSummary: "Generated experiments using Deepseek conditioned on the detected objects array and user constraints.",
      });

    } else {
      return res.status(400).json({ error: "Unsupported provider. Use 'gemini' or 'deepseek'." });
    }

  } catch (error: any) {
    console.error("Analyze Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate experiments" });
  }
});

// Proxy route for /api/analyze just in case
app.post("/api/analyze", async (req, res) => {
  return res.redirect(308, "/analyze");
});

// Start listening and serve assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[STEMSense Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
