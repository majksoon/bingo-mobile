from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, field_serializer
from typing import Optional, List

# ===== Auth =====


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_max_length(cls, v: str) -> str:
        # bcrypt limit – 72 bajty; na start ograniczamy do 72 znaków
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
    id: int


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

    @field_serializer("created_at")
    def parse_date(self, dt: datetime, _):
        return dt.strftime("%H:%M %d-%m-%Y")

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
    rooms_created: int

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    username: Optional[str] = None


# ===== Tasks / Bingo =====


class TaskOut(BaseModel):
    assignment_id: int
    description: str
    finished_by: Optional[int]
    # kolor gracza, który ukończył to zadanie (z RoomMember.color)
    color: Optional[str] = None


class TaskFinished(BaseModel):
    game_finished: bool
    # zwycięzca (jeśli jest)
    winner_id: Optional[int] = None
    winner_username: Optional[str] = None
    # "bingo", "most_tiles", "draw"
    win_type: Optional[str] = None
    # liczba pól zwycięzcy (dla most_tiles / opcjonalnie bingo)
    winner_tiles: Optional[int] = None
    # przy remisie: lista nicków oraz liczba pól
    draw_usernames: Optional[List[str]] = None
    draw_tiles: Optional[int] = None
