# app/gql/schema.py
from __future__ import annotations
import bcrypt
import strawberry
from datetime import date, timedelta
from typing import Optional, List
from strawberry.types import Info
from sqlalchemy import select, func

from app.db.models import User as UserModel, UsageDaily, Connection as ConnModel, ConnectionStatus
from app.auth.auth import create_access_token, create_refresh_token, decode_token, hash_password, verify_password

@strawberry.input
class RegisterInput:
    name: str
    phone_number: str
    password: str
    usage_goal_minutes: int = 0

@strawberry.input
class LoginInput:
    phone_number: str
    password: str

@strawberry.type
class AuthPayload:
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"

@strawberry.type
class Me:
    id: strawberry.ID
    name: str
    phone_number: str

@strawberry.type
class WeeklyProgress:
    goal_minutes: int
    total_ms: int
    percent: float
@strawberry.input
class UserUpdateInput:
    name: Optional[str] = None
    usage_goal_minutes: Optional[int] = None

@strawberry.type
class User:
    id: strawberry.ID
    name: str
    phone_number: str
    usage_goal_minutes: int


    @strawberry.field
    async def weekly_progress(self, info: Info, week_start: date) -> WeeklyProgress:
        session = info.context["session"]
        week_end = week_start + timedelta(days=7)
        total_ms = (
            await session.execute(
                select(func.coalesce(func.sum(UsageDaily.total_ms), 0))
                .where(UsageDaily.user_id == self.id)
                .where(UsageDaily.date >= week_start)
                .where(UsageDaily.date < week_end)
            )
        ).scalar_one()
        # load goal
        u = await session.get(UserModel, self.id)
        goal = u.usage_goal_minutes if u else 0
        pct = min(100.0, (total_ms / (goal * 60_000)) * 100) if goal > 0 else 0.0
        return WeeklyProgress(goal_minutes=goal, total_ms=total_ms, percent=pct)

@strawberry.type
class Query:
    @strawberry.field
    async def me(self, info: Info) -> Optional[User]:
        cu = info.context.get("current_user")
        if not cu:
            return None
        session = info.context["session"]
        u = await session.get(UserModel, cu.id)
        if not u:
            return None
        return User(
            id=str(u.id),
            name=u.name,
            phone_number=u.phone_number,
            usage_goal_minutes=u.usage_goal_minutes,
        )

    @strawberry.field
    async def user(self, info: Info, id: strawberry.ID) -> Optional[User]:
        current_user = info.context.get("current_user")
        if not current_user:
            raise PermissionError("Authentication required")
        if str(current_user.id) != str(self.id):
            raise PermissionError("Not allowed to view other users’ data")
        
        session = info.context["session"]
        u = await session.get(UserModel, id)
        if not u:
            return None
        return User(
            id=str(u.id),
            name=u.name,
            phone_number=u.phone_number,
            usage_goal_minutes=u.usage_goal_minutes,
        )

    @strawberry.field
    async def search_users(self, info: Info, q: str, limit: int = 20) -> List[User]:
        current_user = info.context.get("current_user")
        if not current_user:
            raise PermissionError("Authentication required")
        if str(current_user.id) != str(self.id):
            raise PermissionError("Not allowed to view other users’ data")
        
        session = info.context["session"]
        rows = (await session.execute(
            select(UserModel).where(UserModel.name.ilike(f"%{q}%")).limit(limit)
        )).scalars().all()
        return [
            User(
                id=str(u.id),
                name=u.name,
                phone_number=u.phone_number,
                usage_goal_minutes=u.usage_goal_minutes,
            )
            for u in rows
        ]

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def update_user(self, info, data: UserUpdateInput) -> User:
        cu = info.context.get("current_user")
        if not cu:
            raise PermissionError("Authentication required")

        session = info.context["session"]

        # Load the current user from DB
        user = await session.get(UserModel, cu.id)
        if not user:
            raise ValueError("User not found")

        # Apply only provided fields
        if data.name is not None:
            user.name = data.name
        if data.usage_goal_minutes is not None:
            user.usage_goal_minutes = data.usage_goal_minutes

        await session.commit()
        await session.refresh(user)

        return User(
            id=str(user.id),
            name=user.name,
            phone_number=user.phone_number,
            usage_goal_minutes=user.usage_goal_minutes,
        )

    @strawberry.mutation
    async def add_contact(self, info: Info, phone_number: str) -> User:
        cu = info.context.get("current_user")
        if not cu:
            raise PermissionError("Authentication required")

        session = info.context["session"]

        # Get the invoking user
        user = await session.get(UserModel, cu.id)
        if not user:
            raise ValueError("User not found")

        # Find the other user by phone number
        other_user = (
            await session.execute(
                select(UserModel).where(UserModel.phone_number == phone_number)
            )
        ).scalar_one_or_none()

        if not other_user:
            raise ValueError("No user found with this phone number")

        if other_user.id == user.id:
            raise ValueError("Cannot add yourself as a contact")

        # Check if connection already exists
        existing = (
            await session.execute(
                select(ConnModel).where(
                    ConnModel.user_id == user.id,
                    ConnModel.other_user_id == other_user.id,
                )
            )
        ).scalar_one_or_none()

        if existing:
            raise ValueError("Contact already added")

        conn1 = ConnModel(
            user_id=user.id,
            other_user_id=other_user.id,
            status=ConnectionStatus.accepted,  
        )
        conn2 = ConnModel(
            user_id=other_user.id,
            other_user_id=user.id,
            status=ConnectionStatus.accepted,# set to pending to correctly implement
        )

        session.add_all([conn1, conn2])
        await session.commit()

        return User(
            id=str(other_user.id),
            name=other_user.name,
            phone_number=other_user.phone_number,
            usage_goal_minutes=other_user.usage_goal_minutes,
        )

    @strawberry.mutation
    async def add_daily_usage(
        self,
        info: Info,
        user_id: strawberry.ID,
        date_: date,
        total_ms: int,
    ) -> bool:
        session = info.context["session"]
        row = (await session.execute(
            select(UsageDaily).where(
                UsageDaily.user_id == user_id, UsageDaily.date == date_
            )
        )).scalar_one_or_none()

        if row:
            row.total_ms = total_ms
        else:
            session.add(UsageDaily(user_id=user_id, date=date_, total_ms=total_ms))

        await session.commit()
        return True

    @strawberry.mutation
    async def register(self, info: Info, data: RegisterInput) -> Me:
        session = info.context["session"]
        # ensure unique phone_number
        exists = await session.execute(
            select(UserModel).where(UserModel.phone_number == data.phone_number)
        )
        if exists.scalar_one_or_none():
            raise ValueError("Phone number already registered")

        user = UserModel(
            name=data.name,
            phone_number=data.phone_number,
            usage_goal_minutes=data.usage_goal_minutes,
            password_hash=hash_password(data.password),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return Me(id=user.id, name=user.name, phone_number=user.phone_number)
    
    @strawberry.mutation
    async def login(self, info: Info, data: LoginInput) -> AuthPayload:
        session = info.context["session"]
        q = await session.execute(
            select(UserModel).where(UserModel.phone_number == data.phone_number)
        )
        user = q.scalar_one_or_none()
        if not user or not user.is_active or not verify_password(data.password, user.password_hash):
            raise ValueError("Invalid credentials")

        return AuthPayload(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )
    
    @strawberry.mutation
    async def refresh_token(self, info: Info, refresh_token: str) -> AuthPayload:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")
        user_id = payload.get("sub")
        # (optional) check user still active, token revocation list, etc.
        return AuthPayload(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
        )

schema = strawberry.Schema(query=Query, mutation=Mutation, types=[User, WeeklyProgress])
