from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.security import limiter
from app.api.endpoints import router as api_router
from app.models.isolation_forest import model_manager
from app.utils.logger import logger
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-performance anomaly detection microservice",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG_MODE else None,
    redoc_url="/redoc" if settings.DEBUG_MODE else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up Anomaly Detection Service...")
    # Change working directory context if needed, but model path is relative
    try:
        model_manager.load_model()
    except Exception as e:
        logger.error(f"Failed to load model during startup: {e}")
        # Not exiting here so the app can still boot, but requests will fail.
        # In strict environments, you might want to `import sys; sys.exit(1)`

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Anomaly Detection Service...")
