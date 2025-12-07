from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import random

from .. import models, schemas
from ..db import get_db
from ..security import get_current_user, hash_password, verify_password
from .chat import ensure_member
from pydantic import BaseModel


class JoinRoomPayload(BaseModel):
    password: str | None = None


router = APIRouter(prefix="/rooms", tags=["rooms"])

# dostępne kolory dla graczy w pokoju
PLAYER_COLORS = [
    "#e11d48",  # róż/czerwony
    "#2563eb",  # niebieski
    "#22c55e",  # zielony
    "#a855f7",  # fiolet
    "#f97316",  # pomarańcz
]


def assign_color(room: models.Room) -> str:
    """Zwraca wolny kolor w pokoju; jeśli wszystkie zajęte – losuje z istniejących."""
    used_colors = {m.color for m in room.members if m.color}
    for c in PLAYER_COLORS:
        if c not in used_colors:
            return c
    return random.choice(PLAYER_COLORS)


@router.get("", response_model=list[schemas.RoomOut])
def list_rooms(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rooms = db.query(models.Room).all()

    result: list[schemas.RoomOut] = []
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
        .order_by(func.random())
        .limit(25)
        .all()
    )

    for task in random_tasks:
        member = models.TaskAssignment(
            finishing_uid=None, room_id=room.id, task_id=task.id
        )
        db.add(member)
    db.commit()

    # twórca pokoju od razu dołącza z kolorem
    color = assign_color(room)
    member = models.RoomMember(room_id=room.id, user_id=user.id, color=color)
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
        if not password or not verify_password(password, room.password_hash):
            raise HTTPException(status_code=401, detail="Invalid room password")

    existing = (
        db.query(models.RoomMember)
        .filter(
            models.RoomMember.room_id == room.id,
            models.RoomMember.user_id == user.id,
        )
        .first()
    )
    if not existing:
        color = assign_color(room)
        db.add(models.RoomMember(room_id=room.id, user_id=user.id, color=color))
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

    members_colors = {m.user_id: m.color for m in room.members}

    tasks = (
        db.query(models.TaskAssignment, models.Task)
        .join(models.Task)
        .filter(models.TaskAssignment.room_id == room.id)
        .order_by(models.TaskAssignment.id)
        .all()
    )

    return [
        schemas.TaskOut(
            assignment_id=assignment.id,
            description=task.description,
            finished_by=assignment.finishing_uid,
            color=members_colors.get(assignment.finishing_uid),
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
        db.query(models.TaskAssignment, models.Task)
        .join(models.Task)
        .filter(models.TaskAssignment.id == asg_id)
        .order_by(models.TaskAssignment.id)
    ).first()

    if assignment.finishing_uid is not None:
        raise HTTPException(status_code=403, detail="Task already finished")

    assignment.finishing_uid = user.id

    # aktualny stan planszy
    results = (
        db.query(models.TaskAssignment, models.Task)
        .join(models.Task)
        .filter(models.TaskAssignment.room_id == room_id)
        .order_by(models.TaskAssignment.id)
        .all()
    )

    uids_flat = [row[0].finishing_uid for row in results]

    size = 5
    map_2d: list[list[int | None]] = []
    for i in range(0, len(uids_flat), size):
        map_2d.append(uids_flat[i : i + size])

    # wszyscy użytkownicy w pokoju (do statystyk + nicków)
    room_users = (
        db.query(models.Room, models.RoomMember, models.User)
        .select_from(models.Room)
        .join(models.RoomMember)
        .join(models.User)
        .filter(models.Room.id == room_id)
        .all()
    )
    users_by_id = {u.id: u for _room, _member, u in room_users}

    winner_id: int | None = None
    win_type: str | None = None
    winner_tiles: int | None = None
    draw_usernames: list[str] | None = None
    draw_tiles: int | None = None

    # ===== 1. klasyczne bingo =====

    # wiersze
    for row_vals in map_2d:
        s = set(row_vals)
        if len(s) == 1 and None not in s:
            winner_id = next(iter(s))
            win_type = "bingo"
            break

    # kolumny
    if winner_id is None:
        for i in range(size):
            col = [row_vals[i] for row_vals in map_2d]
            s = set(col)
            if len(s) == 1 and None not in s:
                winner_id = next(iter(s))
                win_type = "bingo"
                break

    # przekątne
    if winner_id is None:
        diag1 = [row_vals[i] for i, row_vals in enumerate(map_2d)]
        s = set(diag1)
        if len(s) == 1 and None not in s:
            winner_id = next(iter(s))
            win_type = "bingo"
        else:
            diag2 = [row_vals[-i - 1] for i, row_vals in enumerate(map_2d)]
            s = set(diag2)
            if len(s) == 1 and None not in s:
                winner_id = next(iter(s))
                win_type = "bingo"

    # jeśli bingo
    if winner_id is not None and win_type == "bingo":
        # zliczamy ile pól ma zwycięzca (informacyjnie)
        winner_tiles = uids_flat.count(winner_id)
        winner_username = None
        if winner_id in users_by_id:
            winner_username = users_by_id[winner_id].username or users_by_id[
                winner_id
            ].email

        # statystyki
        for _room, _member, u in room_users:
            u.games_played += 1
            if u.id == winner_id:
                u.games_won += 1

        room.done = True
        room.winner_uid = winner_id
        db.commit()

        return schemas.TaskFinished(
            game_finished=True,
            winner_id=winner_id,
            winner_username=winner_username,
            win_type="bingo",
            winner_tiles=winner_tiles,
        )

    # ===== 2. brak bingo – sprawdzamy czy plansza pełna =====

    if None not in uids_flat:
        # policz ile pól ma każdy gracz
        counts: dict[int, int] = {}
        for uid_val in uids_flat:
            counts[uid_val] = counts.get(uid_val, 0) + 1

        max_count = max(counts.values())
        leaders = [uid_val for uid_val, c in counts.items() if c == max_count]

        # każdy rozegrał grę
        for _room, _member, u in room_users:
            u.games_played += 1

        if len(leaders) == 1:
            # zwycięzca z największą liczbą pól
            winner_id = leaders[0]
            winner_tiles = max_count
            winner_username = None
            if winner_id in users_by_id:
                winner_username = users_by_id[winner_id].username or users_by_id[
                    winner_id
                ].email

            for _room, _member, u in room_users:
                if u.id == winner_id:
                    u.games_won += 1

            room.done = True
            room.winner_uid = winner_id
            db.commit()

            return schemas.TaskFinished(
                game_finished=True,
                winner_id=winner_id,
                winner_username=winner_username,
                win_type="most_tiles",
                winner_tiles=winner_tiles,
            )
        else:
            # remis – kilku graczy ma tyle samo pól
            draw_usernames = []
            for uid_val in leaders:
                user_obj = users_by_id.get(uid_val)
                if user_obj:
                    draw_usernames.append(
                        user_obj.username or user_obj.email
                    )

            room.done = True
            room.winner_uid = None
            db.commit()

            return schemas.TaskFinished(
                game_finished=True,
                winner_id=None,
                winner_username=None,
                win_type="draw",
                draw_usernames=draw_usernames,
                draw_tiles=max_count,
            )

    # ===== 3. gra dalej trwa =====

    db.commit()
    return schemas.TaskFinished(
        game_finished=False,
        winner_id=None,
        winner_username=None,
        win_type=None,
    )
