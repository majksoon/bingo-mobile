from fastapi import APIRouter, Depends
from ..security import get_current_user
from .. import schemas

router = APIRouter(tags=["profile"])


@router.get("/me", response_model=schemas.ProfileOut)
def get_me(user=Depends(get_current_user)):
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
    )
