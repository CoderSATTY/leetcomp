from fastapi import APIRouter, HTTPException
from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.llm import analyze_with_llm

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    if not req.code.strip():
        return AnalyzeResponse(hints=["Write some code to get analysis"])

    try:
        result = await analyze_with_llm(req.code, req.language, req.problem_title)
        return AnalyzeResponse(
            time_complexity=result.get("time_complexity"),
            space_complexity=result.get("space_complexity"),
            hints=result.get("hints", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
