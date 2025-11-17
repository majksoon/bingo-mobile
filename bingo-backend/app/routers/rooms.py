from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import itertools

from .. import models, schemas
from ..db import get_db
from ..security import get_current_user, hash_password, verify_password
from pydantic import BaseModel
from .chat import ensure_member

class JoinRoomPayload(BaseModel):
    password: str | None = None

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

    random_tasks = (
        db.query(models.Task)
        .filter(models.Task.category == payload.category)
        .order_by(func.random()).limit(25).all()
    )

    for task in random_tasks:
        member = models.TaskAssignment(finishing_uid=None, room_id=room.id, task_id=task.id)
        db.add(member)
    db.commit()
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
    payload: JoinRoomPayload,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    room = db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if len(room.members) >= room.max_players:
        raise HTTPException(status_code=403, detail="Room is full")

    password = payload.password

    if room.password_hash:
        print(not password)
        print(verify_password(password, room.password_hash))
        if not password or not verify_password(password, room.password_hash):
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


@router.get("/{room_id}/tasks", response_model=list[schemas.TaskOut])
def room_tasks(
    room_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    room = db.get(models.Room, room_id)
    ensure_member(db, room.id, user.id)

    tasks = (
        db.query(models.TaskAssignment, models.Task).join(models.Task)
        .filter(models.TaskAssignment.room_id == room.id)
        .order_by(models.TaskAssignment.id).all()
    )

    return [
            schemas.TaskOut(
                assignment_id=assignment.id,
                description=task.description,
                finished_by=assignment.finishing_uid
            )
            for assignment, task in tasks
    ]

@router.get("/{room_id}/tasks/{asg_id}/finished", response_model=schemas.TaskFinished)
def room_finish_task(
    room_id: int,
    asg_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    room = db.get(models.Room, room_id)
    ensure_member(db, room.id, user.id)
    
    if room.done:
        raise HTTPException(status_code=418, detail="The game is finished")

    assignment, task = (
        db.query(models.TaskAssignment, models.Task).join(models.Task)
        .filter(models.TaskAssignment.id == asg_id)
        .order_by(models.TaskAssignment.id)
    ).first()
    
    if assignment.finishing_uid != None:
        raise HTTPException(status_code=403, detail="Task already finished")

    assignment.finishing_uid = user.id
    results = (
        db.query(models.TaskAssignment, models.Task).join(models.Task)
        .filter(models.TaskAssignment.room_id == room_id)
        .order_by(models.TaskAssignment.id)
    ).all()

    w_id = None
    map_2d = [list(map(lambda x: x[0].finishing_uid, row)) for row in itertools.batched(results, 5)]
    for row in map_2d:
        # check rows
        if len(w_id_set:=set(row)) == 1 and None not in w_id_set:
            break
    else:
        for i in range(len(map_2d)):
            # check columns
            col = [row[i] for row in map_2d]
            if len(w_id_set:=set(col)) == 1 and None not in w_id_set:
                break
        else:
            # check diagonals
            diag1 = [row[i] for i, row in enumerate(map_2d)]
            if not len(w_id_set:=set(diag1)) == 1 or None in w_id_set:
                diag2 = [row[-i -1 ] for i, row in enumerate(map_2d)]
                if not len(w_id_set:=set(diag2)) == 1 or None in w_id_set:
                    w_id_set = set([None])

    w_id = list(w_id_set)[0]
    if w_id:
        user.games_won += 1
        room_users = (
            db.query(models.Room, models.RoomMember, models.User)
            .select_from(models.Room).join(models.RoomMember).join(models.User)
            .filter(models.Room.id == room_id)
        ).all()
        for room, member, user in room_users:
            user.games_played += 1

        room.done = True
        db.commit()
        return schemas.TaskFinished(game_finished=True)


    db.commit()
    return schemas.TaskFinished(game_finished=False)

