from pydantic import BaseModel
from typing import List, Optional


class AnalyzeRequest(BaseModel):
    code: str
    language: str = "python"
    problem_title: Optional[str] = None


class AnalyzeResponse(BaseModel):
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    hints: List[str] = []
