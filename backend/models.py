from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    goals = relationship("ShoppingGoal", back_populates="user")
    wishlist_items = relationship("Wishlist", back_populates="user")

class ShoppingGoal(Base):
    __tablename__ = "shopping_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query = Column(String)
    budget = Column(Float)
    status = Column(String, default="active") # active, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="goals")
    plans = relationship("ShoppingPlan", back_populates="goal")

class ShoppingPlan(Base):
    __tablename__ = "shopping_plans"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("shopping_goals.id"))
    name = Column(String)
    total_budget = Column(Float)
    is_saved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    goal = relationship("ShoppingGoal", back_populates="plans")
    items = relationship("CartItem", back_populates="plan", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("shopping_plans.id"))
    product_id = Column(String) # ID from catalog.json or meesho
    name = Column(String)
    category = Column(String)
    price = Column(Float)
    quantity = Column(Integer, default=1)
    trust_score = Column(Float)
    reason = Column(String)

    plan = relationship("ShoppingPlan", back_populates="items")

class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(String)
    name = Column(String)
    price = Column(Float)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="wishlist_items")
