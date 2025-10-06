import os, time, jwt
from passlib.context import CryptContext
from typing import Optional

from app.db.models import User as UserModel

from app.db.sessions import SessionLocal

SECRET_KEY = os.getenv("JWT_SECRET", "default_secret")
ALGORITHM = "HS256"
ACCESS_TTL_SECONDS = 15 * 60
REFRESH_TTL_SECONDS = 7 * 24 * 3600

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    print(type(plain), plain, len(plain))
    return pwd_ctx.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def _make_token(sub: str, ttl: int, token_type: str) -> str:
    now = int(time.time())
    payload = {"sub": str(sub), "type": token_type, "iat": now, "exp": now + ttl}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(user_id: str) -> str:
    return _make_token(user_id, ACCESS_TTL_SECONDS, "access")

def create_refresh_token(user_id: str) -> str:
    return _make_token(user_id, REFRESH_TTL_SECONDS, "refresh")

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    
async def verify_token(token: str):
    """
    Decode the JWT and load the corresponding User from the database.
    Returns a UserModel instance or None.
    """
    try:
        # 1. Decode the JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            print("verify_token: token missing 'sub'")
            return None

        # 2. Load user from DB
        async with SessionLocal() as session:
            user = await session.get(UserModel, user_id)
            if not user:
                print("verify_token: user not found")
                return None
            return user

    except jwt.ExpiredSignatureError:
        print("verify_token: token expired")
        return None
    except jwt.InvalidTokenError as e:
        print("verify_token: invalid token", e)
        return None
