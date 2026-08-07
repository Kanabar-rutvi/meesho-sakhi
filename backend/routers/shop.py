from fastapi import APIRouter, Depends
from pydantic import BaseModel
import json
from pathlib import Path
from fastapi.responses import StreamingResponse
from orchestrator import AgentOrchestrator
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/shop", tags=["shop"])

BASE_DIR = Path(__file__).resolve().parent.parent

with (BASE_DIR / "catalog.json").open("r", encoding="utf-8") as f:
    CATALOG = json.load(f)

class ShoppingRequest(BaseModel):
    query: str

@router.post("")
async def shop(request: ShoppingRequest, db: Session = Depends(get_db)):
    orchestrator = AgentOrchestrator(catalog=CATALOG, db_session=db)
    return StreamingResponse(
        orchestrator.execute_full_plan(request.query),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

