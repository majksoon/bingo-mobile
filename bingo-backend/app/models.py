from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint, event, Boolean
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

    rooms = relationship("Room", back_populates="owner")
    messages = relationship("Message", back_populates="user")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)
    category = Column(String, nullable=False)
    max_players = Column(Integer, default=5, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    done = Column(Boolean, default=False, nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="rooms")

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
    category = Column(Integer, CheckConstraint("category IN ('Nauka', 'Sport')"), nullable=False)

def insert_data(target, connection, **kw):
    data = []
    for i in range(1, 101):
        if i <= 50:
            category = 'Nauka'
            description = NAUKA_TASKS[i-1]  # -1 bo lista jest od 0
        else:
            category = 'Sport'
            description = SPORT_TASKS[i-51]  # -51 bo zaczynamy od 0 dla Sport
            
        data.append({
            'id': i,
            'description': description,
            'category': category
        })
    
    connection.execute(target.insert(), data)

event.listen(Task.__table__, 'after_create', insert_data)

class TaskAssignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    # Null uid means not finished
    finishing_uid = Column(Integer, ForeignKey("users.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)



