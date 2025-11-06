from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import get_current_user

router = APIRouter(prefix="/rooms", tags=["chat"])


def ensure_member(db: Session, room_id: int, user_id: int):
    member = (
        db.query(models.RoomMember)
        .filter(
            models.RoomMember.room_id == room_id, models.RoomMember.user_id == user_id
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this room")


@router.get("/{room_id}/messages", response_model=list[schemas.MessageOut])
def get_messages(
    room_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    room = db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    ensure_member(db, room_id, user.id)

    msgs = (
        db.query(models.Message)
        .filter(models.Message.room_id == room_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return [
        schemas.MessageOut(
            id=m.id,
            user_id=m.user_id,
            username=m.user.username,
            content=m.content,
            created_at=m.created_at,
        )
        for m in msgs
    ]


@router.post(
    "/{room_id}/messages",
    response_model=schemas.MessageOut,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    room_id: int,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    room = db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    ensure_member(db, room_id, user.id)

    msg = models.Message(room_id=room_id, user_id=user.id, content=payload.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return schemas.MessageOut(
        id=msg.id,
        user_id=msg.user_id,
        username=msg.user.username,
        content=msg.content,
        created_at=msg.created_at,
    )
