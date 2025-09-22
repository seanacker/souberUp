import strawberry


# Simple in-memory store for the MVP
_USAGE_GOAL: int = 0


@strawberry.type
class UsageGoal:
	usageGoal: int


@strawberry.type
class SetUsageGoalResult:
	success: bool


@strawberry.type
class Query:
	@strawberry.field
	def getUsageGoal(self) -> UsageGoal:
		return UsageGoal(usageGoal=_USAGE_GOAL)


@strawberry.type
class Mutation:
	@strawberry.mutation
	def setUsageGoal(self, usageGoal: int) -> SetUsageGoalResult:
		global _USAGE_GOAL
		_USAGE_GOAL = usageGoal
		return SetUsageGoalResult(success=True)


schema = strawberry.Schema(query=Query, mutation=Mutation)


