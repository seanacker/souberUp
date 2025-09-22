from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from .graphql_schema import schema


app = FastAPI(title="Soberup API", version="0.1.0")

# Allow all origins for now during development. Tighten in production.
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/api/v1/graphql")


