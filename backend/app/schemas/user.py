from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    document_id: Optional[str] = None
    role: UserRole = UserRole.POSTULANTE
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    document_id: Optional[str] = None
    role: Optional[UserRole] = UserRole.POSTULANTE

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    document_id: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str
