# STEMSense - LLM integration TODO

- [x] Step 1: Update backend/server.py

  - Add /analyze endpoint
  - Implement LLM provider clients (Gemini + DeepSeek via REST/OpenAI-compatible pattern)
  - Build structured prompt using detected items array + userData constraints + customPrompt
  - Return JSON with experimentPlan + safety/materials/steps

- [x] Step 2: Update frontend/scan.html

  - Add UI to collect: provider, apiKey, customPrompt, and optional user constraints
  - On Accept & Store, call /analyze with localStorage detectedItems + user inputs
  - Render returned experimentPlan in the results panel/modal

- [x] Step 3: Add minimal validation and error handling

  - Missing apiKey/provider/customPrompt
  - Invalid LLM response parsing

- [ ] Step 4: Run and test

  - Start backend + frontend
  - Verify /health and /detect still work
  - Verify /analyze works end-to-end

