# app/gql/schema.py
from __future__ import annotations
import strawberry
from datetime import date, timedelta
from typing import Optional, List
from strawberry.types import Info
from sqlalchemy import select, func

from app.db.models import User as UserModel, UsageDaily, Connection as ConnModel, ConnectionStatus

@strawberry.type
class WeeklyProgress:
    goal_minutes: int
    total_ms: int
    percent: float

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
    async def user(self, info: Info, id: strawberry.ID) -> Optional[User]:
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
    async def upsert_user(
        self,
        info: Info,
        name: str,
        phone_number: str,
        usage_goal_minutes: int,
    ) -> User:
        session = info.context["session"]
        existing = (await session.execute(
            select(UserModel).where(UserModel.phone_number == phone_number)
        )).scalar_one_or_none()

        if existing:
            existing.name = name
            existing.usage_goal_minutes = usage_goal_minutes
            await session.commit()
            await session.refresh(existing)
            u = existing
        else:
            u = UserModel(
                name=name,
                phone_number=phone_number,
                usage_goal_minutes=usage_goal_minutes,
            )
            session.add(u)
            await session.commit()
            await session.refresh(u)

        return User(
            id=str(u.id),
            name=u.name,
            phone_number=u.phone_number,
            usage_goal_minutes=u.usage_goal_minutes,
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

schema = strawberry.Schema(query=Query, mutation=Mutation, types=[User, WeeklyProgress])
