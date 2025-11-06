# app/security.py
from datetime import datetime, timedelta
from typing import Optional
import os
import hashlib
import hmac

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .db import get_db
from . import models

# ===== JWT config =====

SECRET_KEY = "super-secret-change-me"  # TODO: wrzuć do .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ===== PBKDF2 config =====

PBKDF2_ALGORITHM = "sha256"
PBKDF2_ITERATIONS = 100_000
PBKDF2_SALT_BYTES = 16  # 128-bit salt


def _pbkdf2_hash_password(password: str) -> str:
    """
    Zwraca string w formacie:
    pbkdf2_sha256$iteracje$salt_hex$hash_hex
    """
    if password is None:
        password = ""
    password_bytes = password.encode("utf-8")

    salt = os.urandom(PBKDF2_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        password_bytes,
        salt,
        PBKDF2_ITERATIONS,
    )

    salt_hex = salt.hex()
    dk_hex = dk.hex()
    return f"pbkdf2_{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${salt_hex}${dk_hex}"


def _pbkdf2_verify_password(password: str, hashed: str) -> bool:
    """
    Weryfikuje string w formacie:
    pbkdf2_sha256$iteracje$salt_hex$hash_hex
    """
    try:
        scheme, iter_str, salt_hex, dk_hex = hashed.split("$", 3)
        if not scheme.startswith("pbkdf2_"):
            return False
        iterations = int(iter_str)
        salt = bytes.fromhex(salt_hex)
        expected_dk = bytes.fromhex(dk_hex)
    except Exception:
        # uszkodzony format hasha
        return False

    if password is None:
        password = ""
    password_bytes = password.encode("utf-8")

    dk = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        password_bytes,
        salt,
        iterations,
    )

    return hmac.compare_digest(dk, expected_dk)


# ===== API, które używa reszta kodu =====


def hash_password(password: str) -> str:
    """
    Używane przy rejestracji: zamienia plain hasło na hash do zapisania w bazie.
    """
    return _pbkdf2_hash_password(password)


def verify_password(plain: str, hashed: str) -> bool:
    """
    Używane przy logowaniu: sprawdza, czy podane hasło pasuje do hasha z bazy.
    """
    return _pbkdf2_verify_password(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise cred_exc
    except JWTError:
        raise cred_exc

    user = db.get(models.User, user_id)
    if user is None:
        raise cred_exc
    return user
