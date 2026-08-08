from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import json
from pathlib import Path
from fastapi.responses import StreamingResponse
from orchestrator import AgentOrchestrator
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/shop", tags=["shop"])

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    with (BASE_DIR / "catalog.json").open("r", encoding="utf-8") as f:
        CATALOG = json.load(f)
except Exception as e:
    raise RuntimeError(f"Failed to load catalog.json: {str(e)}")

class ShoppingRequest(BaseModel):
    query: str

@router.post("")
async def shop(request: ShoppingRequest, db: Session = Depends(get_db)):
    """
    Process a shopping query through the 8-agent pipeline.
    Returns Server-Sent Events (SSE) stream with agent status updates.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        orchestrator = AgentOrchestrator(catalog=CATALOG, db_session=db)
        return StreamingResponse(
            orchestrator.execute_full_plan(request.query),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline execution failed: {str(e)}"
        )


