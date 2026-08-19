from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from pathlib import Path
from models.database import engine, Base
from routers import datasets, training, tuning, explainability, registry, deployment, auth

BASE_DIR = Path(__file__).resolve().parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(BASE_DIR / "storage" / "datasets", exist_ok=True)
    os.makedirs(BASE_DIR / "storage" / "models", exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="AutoML Studio v2 API", lifespan=lifespan)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:5176,http://127.0.0.1:5176,http://localhost:5177,http://127.0.0.1:5177",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["datasets"])
app.include_router(training.router, prefix="/api/v1/training", tags=["training"])
app.include_router(tuning.router, prefix="/api/v1/tuning", tags=["tuning"])
app.include_router(explainability.router, prefix="/api/v1/xai", tags=["xai"])
app.include_router(registry.router, prefix="/api/v1/registry", tags=["registry"])
app.include_router(deployment.router, prefix="/api/v1/deployment", tags=["deployment"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
