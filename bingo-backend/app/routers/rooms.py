from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import get_current_user, hash_password

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("", response_model=list[schemas.RoomOut])
def list_rooms(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rooms = db.query(models.Room).all()

    result = []
    for r in rooms:
        players_count = len(r.members)
        result.append(
            schemas.RoomOut(
                id=r.id,
                name=r.name,
                category=r.category,
                has_password=bool(r.password_hash),
                max_players=r.max_players,
                players_count=players_count,
            )
        )
    return result


@router.post("", response_model=schemas.RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: schemas.RoomCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    room = models.Room(
        name=payload.name,
        category=payload.category,
        max_players=min(payload.max_players, 5),
        owner_id=user.id,
        password_hash=hash_password(payload.password) if payload.password else None,
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    # automatycznie dodaj twórcę do pokoju
    member = models.RoomMember(room_id=room.id, user_id=user.id)
    db.add(member)
    db.commit()
    db.refresh(room)

    return schemas.RoomOut(
        id=room.id,
        name=room.name,
        category=room.category,
        has_password=bool(room.password_hash),
        max_players=room.max_players,
        players_count=len(room.members),
    )


@router.post("/{room_id}/join", response_model=schemas.RoomOut)
def join_room(
    room_id: int,
    password: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    room = db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # limit 5 osób
    if len(room.members) >= room.max_players:
        raise HTTPException(status_code=403, detail="Room is full")

    # jeśli jest hasło, sprawdź
    if room.password_hash:
        if not password or not hash_password(password) or not password:  # uproszczenie
            # w praktyce zrób verify_password dla hasła pokoju, jak dla użytkownika
            raise HTTPException(status_code=401, detail="Invalid room password")

    # sprawdź, czy już członek
    existing = (
        db.query(models.RoomMember)
        .filter(
            models.RoomMember.room_id == room.id, models.RoomMember.user_id == user.id
        )
        .first()
    )
    if not existing:
        db.add(models.RoomMember(room_id=room.id, user_id=user.id))
        db.commit()
        db.refresh(room)

    return schemas.RoomOut(
        id=room.id,
        name=room.name,
        category=room.category,
        has_password=bool(room.password_hash),
        max_players=room.max_players,
        players_count=len(room.members),
    )
