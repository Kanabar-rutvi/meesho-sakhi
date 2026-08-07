from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from meesho_integration import prepare_order_payload, INTEGRATION_CAPABILITY

router = APIRouter(prefix="/meesho", tags=["meesho"])

class MeeshoProduct(BaseModel):
    id: str
    name: str
    brand: Optional[str] = ""
    category: Optional[str] = ""
    price: float
    rating: Optional[float] = 0
    reviews: Optional[int] = 0
    quantity: Optional[int] = 1
    trust_score: Optional[float] = 0
    reason: Optional[str] = ""

class MeeshoOrderRequest(BaseModel):
    items: List[MeeshoProduct]

@router.post("/prepare-order")
async def meesho_prepare_order(request: MeeshoOrderRequest):
    try:
        items = [item.model_dump() for item in request.items]
        payload = prepare_order_payload(items)
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/integration-status")
async def meesho_integration_status():
    return INTEGRATION_CAPABILITY
