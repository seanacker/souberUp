from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.graphql.schema import schema as graphql_schema
from app.db.sessions import get_session


app = FastAPI(title="Soberup API", version="0.1.0")

async def get_context(request: Request, session = Depends(get_session)):
    return {"request": request, "session": session}

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


