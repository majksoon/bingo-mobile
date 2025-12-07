from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    CheckConstraint,
    event,
    Boolean,
)
from sqlalchemy.orm import relationship
from .db import Base
from .tasks import NAUKA_TASKS, SPORT_TASKS


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    username = Column(String, nullable=True)

    games_played = Column(Integer, default=0, nullable=False)
    games_won = Column(Integer, default=0, nullable=False)

    # pokoje, których user jest właścicielem
    rooms = relationship(
        "Room",
        back_populates="owner",
        foreign_keys="Room.owner_id",
    )

    messages = relationship("Message", back_populates="user")

    # opcjonalnie lista pokoi, w których user wygrał
    won_rooms = relationship(
        "Room",
        foreign_keys="Room.winner_uid",
        viewonly=True,
    )


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)
    category = Column(String, nullable=False)
    max_players = Column(Integer, default=5, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    done = Column(Boolean, default=False, nullable=False)

    # zwycięzca bingo (id użytkownika), None – jeszcze nikt nie wygrał
    winner_uid = Column(Integer, ForeignKey("users.id"), nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship(
        "User",
        back_populates="rooms",
        foreign_keys=[owner_id],
    )

    winner = relationship(
        "User",
        foreign_keys=[winner_uid],
        viewonly=True,
    )

    members = relationship(
        "RoomMember", back_populates="room", cascade="all, delete-orphan"
    )
    messages = relationship(
        "Message", back_populates="room", cascade="all, delete-orphan"
    )


class RoomMember(Base):
    __tablename__ = "room_members"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # unikalny kolor gracza w pokoju
    color = Column(String, nullable=True)

    room = relationship("Room", back_populates="members")
    user = relationship("User")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    room = relationship("Room", back_populates="messages")
    user = relationship("User", back_populates="messages")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    # tekstowe kategorie z constraintem
    category = Column(
        String,
        CheckConstraint("category IN ('Nauka', 'Sport')"),
        nullable=False,
    )


def insert_data(target, connection, **kw):
    data = []
    for i in range(1, 101):
        if i <= 50:
            category = "Nauka"
            description = NAUKA_TASKS[i - 1]
        else:
            category = "Sport"
            description = SPORT_TASKS[i - 51]

        data.append(
            {
                "id": i,
                "description": description,
                "category": category,
            }
        )

    connection.execute(target.insert(), data)


event.listen(Task.__table__, "after_create", insert_data)


class TaskAssignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    # Null uid means not finished
    finishing_uid = Column(Integer, ForeignKey("users.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
