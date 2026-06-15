from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class AnalyzeRequest(BaseModel):
    provider: str
    customPrompt: str
    items: List[str]
    apiKey: Optional[str] = Field(default=None)
    userData: Dict[str, Any] = Field(default_factory=dict)

print(AnalyzeRequest.model_validate({'provider': 'gemini', 'customPrompt': 'a', 'items': ['b']}))
