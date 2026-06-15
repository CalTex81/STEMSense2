"""
STEMSense Detection API
-----------------------



FastAPI server that runs YOLO inference on frames sent from the browser camera page.
Run:
    python backend/server.py
    OR
    uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
"""

import io
import os
import base64
from pathlib import Path

# NOTE: LLM calls are executed via direct REST using `requests`.
# This file does not store API keys; keys are provided per request by the client.


from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from PIL import Image
import numpy as np
from ultralytics import YOLO

import json
from typing import Any, Dict, List, Optional

import requests


def load_env_file(path: str = ".env"):
    env_path = Path(path)
    if not env_path.is_file():
        return
    with env_path.open("r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


load_env_file()


from pydantic import BaseModel, Field

class AnalyzeRequest(BaseModel):
    provider: str
    customPrompt: str
    items: List[str]
    apiKey: Optional[str] = Field(default=None)
    userData: Dict[str, Any] = Field(default_factory=dict)


class ExperimentStep(BaseModel):
    step: int
    instruction: str


class ExperimentPlan(BaseModel):
    title: str
    experiments: List[Dict[str, Any]]


class AnalyzeResponse(BaseModel):
    experimentPlan: Dict[str, Any]
    reasoningSummary: str



# Load model from Ultralytics YOLOv8
model = YOLO("yolov8n.pt")
model_name = "yolov8n"

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="STEMSense Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():

    return {"status": "ok", "model": model_name}


GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


def _build_custom_stem_prompt(customPrompt: str, items: List[str], userData: Dict[str, Any]) -> str:
    focus = userData.get("learningFocus")
    audience = userData.get("audience")
    time_limit = userData.get("timeLimitMinutes")
    materials = userData.get("materialsAvailable")
    constraints = userData.get("constraints")

    user_data_block = {
        "learningFocus": focus,
        "audience": audience,
        "timeLimitMinutes": time_limit,
        "materialsAvailable": materials,
        "constraints": constraints,
    }

    return (
        "CUSTOM PROMPT (may override style/content):\n"
        f"{customPrompt}\n\n"
        "DETECTED OBJECTS (array):\n"
        f"{items}\n\n"
        "USER DATA / CONSTRAINTS (JSON):\n"
        f"{json.dumps(user_data_block, ensure_ascii=False)}\n\n"
        "INSTRUCTIONS:\n"
        "- Come up with multiple feasible STEM experiments (3-5) based on the detected objects.\n"
        "- Each experiment must include: title, learning goal, difficulty, estimated time, materials, safety, and step-by-step procedure.\n"
        "- Use the detected objects explicitly (how they connect to the concept).\n"
        "- If materials are limited, adapt steps using substitutions.\n"
        "- Output MUST be valid JSON matching this schema exactly:\n"
        "{\n"
        '  "title": string,\n'
        '  "experiments": [\n'
        "    {\n"
        '      "name": string,\n'
        '      "learningGoal": string,\n'
        '      "difficulty": "easy" | "medium" | "hard",\n'
        '      "estimatedTimeMinutes": number,\n'
        '      "materials": string[],\n'
        '      "safetyNotes": string[],\n'
        '      "steps": string[]\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "- Do not include any extra keys outside the schema.\n"
        "- Do not include markdown fences.\n"
    )


def _call_gemini(api_key: str, prompt: str, model: str = "gemini-1.5-flash-latest") -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.6,
        },
    }
    r = requests.post(url, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()
    # Gemini response extraction
    return data["candidates"][0]["content"]["parts"][0]["text"]


def _call_deepseek(api_key: str, prompt: str, model: str = "deepseek-chat") -> str:
    # DeepSeek provides OpenAI-compatible API
    url = "https://api.deepseek.com/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful STEM tutor and experiment planner."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.6,
    }
    r = requests.post(url, json=payload, headers=headers, timeout=60)
    r.raise_for_status()
    data = r.json()
    return data["choices"][0]["message"]["content"]


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):

    if not req.provider:
        raise HTTPException(status_code=400, detail="provider is required")
    if not req.customPrompt:
        raise HTTPException(status_code=400, detail="customPrompt is required")
    if not req.items:
        raise HTTPException(status_code=400, detail="items must be a non-empty list")

    provider = req.provider.strip().lower()
    prompt = _build_custom_stem_prompt(req.customPrompt, req.items, req.userData or {})

    try:
        if provider == "gemini":
            if not GEMINI_API_KEY:
                raise HTTPException(status_code=500, detail="Gemini API key is not configured on the server.")
            text = _call_gemini(GEMINI_API_KEY, prompt)
        elif provider == "deepseek":
            if not req.apiKey:
                raise HTTPException(status_code=400, detail="apiKey is required for DeepSeek")
            text = _call_deepseek(req.apiKey, prompt)
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider. Use 'gemini' or 'deepseek'.")

        # Parse JSON from model output
        parsed = json.loads(text)
        reasoningSummary = (
            "Generated experiments conditioned on the detected objects array and user constraints."
        )
        return AnalyzeResponse(experimentPlan=parsed, reasoningSummary=reasoningSummary)

    except requests.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"LLM provider error: {e.response.text if e.response is not None else str(e)}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned non-JSON or invalid JSON")


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    """
    Accept a JPEG/PNG image frame, run YOLO inference,
    return detected objects with confidence + bounding boxes.
    """
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=415, detail="Unsupported image type")

    raw = await file.read()
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not decode image: {e}")

    img_np = np.array(img)
    w, h = img.width, img.height

    results = model.predict(
        source=img_np,
        conf=0.35,          # confidence threshold
        iou=0.45,           # NMS IoU threshold
        verbose=False,
    )

    detections = []
    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label  = model.names.get(cls_id, str(cls_id))
            conf   = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "label":  label,
                "conf":   round(conf, 3),
                "bbox": {          # normalised 0-1
                    "x":  round(x1 / w, 4),
                    "y":  round(y1 / h, 4),
                    "w":  round((x2 - x1) / w, 4),
                    "h":  round((y2 - y1) / h, 4),
                },
                "bbox_px": {       # absolute pixels
                    "x1": round(x1), "y1": round(y1),
                    "x2": round(x2), "y2": round(y2),
                },
            })

    return JSONResponse({"detections": detections, "count": len(detections)})


def find_available_port(start_port=8000, max_tries=10):
    """Find an available port starting from start_port."""
    import socket
    for port in range(start_port, start_port + max_tries):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind(("0.0.0.0", port))
            sock.close()
            return port
        except OSError as e:
            continue
    raise RuntimeError(f"Could not find available port in range {start_port}-{start_port + max_tries - 1}")


if __name__ == "__main__":
    try:
        port = find_available_port(8000, 10)
        print(f"\n{'='*60}")
        print(f"🚀 STEMSense Backend Server")
        print(f"{'='*60}")
        print(f"📍 Running on: http://localhost:{port}")
        print(f"🌐 API endpoint: http://localhost:{port}/detect")
        print(f"💚 Health check: http://localhost:{port}/health")
        print(f"✅ Server ready. Open scan.html in your browser.")
        print(f"{'='*60}\n")
        uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import sys
        sys.exit(1)
