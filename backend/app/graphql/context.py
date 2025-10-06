# app/graphql/context.py
from typing import Optional, Dict, Any
from strawberry.types import Info
from app.auth.auth import decode_token
from app.db.sessions import SessionLocal
from app.db.models import User as UserModel

async def context_getter(request) -> Dict[str, Any]:
    session = SessionLocal()
    auth = request.headers.get("Authorization", "")
    user: Optional[UserModel] = None

    if auth.startswith("Bearer "):
        payload = decode_token(auth[7:])
        if payload and payload.get("type") == "access":
            user_id = payload.get("sub")
            if user_id:
                user = await session.get(UserModel, user_id)

    return {"session": session, "current_user": user}
