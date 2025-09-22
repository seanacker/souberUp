from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Soberup API", version="0.1.0")

# Allow all origins for now during development. Tighten in production.
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/api/v1/hello")
def read_hello():
	return {"message": "Hello World"}


