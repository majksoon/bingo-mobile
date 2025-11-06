from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routers import auth, rooms, chat, profile

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bingo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # na dev potem ogarniemy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(chat.router)
app.include_router(profile.router)
