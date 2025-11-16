from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator

from typing import Optional, List


# ===== Auth =====


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_max_length(cls, v: str) -> str:
        # bcrypt limit – 72 bajty; na start ograniczymy do 72 znaków
        if len(v) > 72:
            raise ValueError("Password must be at most 72 characters long")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str



class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: Optional[str]

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ===== Rooms =====


class RoomCreate(BaseModel):
    name: str
    password: Optional[str] = None
    category: str
    max_players: int = 5


class RoomOut(BaseModel):
    id: int
    name: str
    category: str
    has_password: bool
    max_players: int
    players_count: int

    class Config:
        from_attributes = True


# ===== Chat =====


class MessageCreate(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: int
    user_id: int
    username: Optional[str]
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Profile =====


class ProfileOut(BaseModel):
    id: int
    email: EmailStr
    username: Optional[str]
    games_played: int
    games_won: int
    winrate: float

    class Config:
        from_attributes = True
