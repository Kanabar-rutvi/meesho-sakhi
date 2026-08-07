from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ShoppingGoalBase(BaseModel):
    query: str
    budget: float

class ShoppingGoalCreate(ShoppingGoalBase):
    pass

class ShoppingGoal(ShoppingGoalBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class CartItemBase(BaseModel):
    product_id: str
    name: str
    category: str
    price: float
    quantity: int = 1
    trust_score: float = 0
    reason: str = ""

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: int

    class Config:
        from_attributes = True

class ShoppingPlanBase(BaseModel):
    name: str
    total_budget: float

class ShoppingPlanCreate(ShoppingPlanBase):
    pass

class ShoppingPlan(ShoppingPlanBase):
    id: int
    is_saved: bool
    created_at: datetime
    items: List[CartItem] = []

    class Config:
        from_attributes = True
