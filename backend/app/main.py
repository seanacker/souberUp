from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.graphql.schema import schema as graphql_schema
from app.db.sessions import SessionLocal, get_session
from app.auth.auth import verify_token


app = FastAPI(title="Soberup API", version="0.1.0")

async def get_context(request: Request, session = Depends(get_session)):
    auth = request.headers.get("Authorization")
    current_user = None
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        try:
            current_user = await verify_token(token)
        except Exception as e:
            print("Token verification failed:", e)

    return {"request": request, "current_user": current_user, "session": SessionLocal()}

# Allow all origins for now during development. Tighten in production.
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

@app.get("/")
async def health():
    return {"ok": True}


graphql_app = GraphQLRouter(
    graphql_schema,
    graphiql=True,
    context_getter=get_context
)
app.include_router(graphql_app, prefix="/api/v1/graphql")


