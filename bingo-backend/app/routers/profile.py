from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..security import get_current_user
from ..db import get_db
from .. import schemas, models

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=schemas.ProfileOut)
def get_me(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rooms_created = (
        db.query(models.Room)
        .filter(models.Room.owner_id == user.id)
        .count()
    )

    games_played = user.games_played or 0
    games_won = user.games_won or 0
    winrate = float(games_won) / games_played if games_played > 0 else 0.0

    return schemas.ProfileOut(
        id=user.id,
        email=user.email,
        username=user.username,
        games_played=games_played,
        games_won=games_won,
        winrate=winrate,
        rooms_created=rooms_created,
    )


@router.put("/me", response_model=schemas.ProfileOut)
def update_me(
    payload: schemas.ProfileUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.username is not None:
        user.username = payload.username
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Nie udało się zaktualizować profilu") from e

    rooms_created = (
        db.query(models.Room)
        .filter(models.Room.owner_id == user.id)
        .count()
    )

    games_played = user.games_played or 0
    games_won = user.games_won or 0
    winrate = float(games_won) / games_played if games_played > 0 else 0.0

    return schemas.ProfileOut(
        id=user.id,
        email=user.email,
        username=user.username,
        games_played=games_played,
        games_won=games_won,
        winrate=winrate,
        rooms_created=rooms_created,
    )
