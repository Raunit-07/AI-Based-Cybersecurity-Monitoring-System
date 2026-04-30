from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.security import limiter
from app.api.endpoints import router as api_router
from app.models.isolation_forest import model_manager
from app.utils.logger import logger

import os

# ================= INIT APP =================
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-performance anomaly detection microservice",
    version="1.0.0",
    docs_url="/docs",        # ALWAYS ENABLE (important for debugging)
    redoc_url="/redoc"
)

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= RATE LIMIT =================
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ================= ROUTES =================
app.include_router(api_router, prefix=settings.API_V1_STR)

# ================= ROOT ROUTE =================
@app.get("/")
def root():
    return {"message": "ML Service Running ✅"}

# ================= HEALTH CHECK =================
@app.get("/health")
def health():
    return {"status": "ok"}

# ================= STARTUP =================
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting Anomaly Detection Service...")

    try:
        # Ensure correct working directory
        model_path = "artifacts/model.joblib"

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")

        model_manager.load_model()
        logger.info("✅ Model loaded successfully")

    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        # Don't crash service — but log clearly

# ================= SHUTDOWN =================
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Shutting down Anomaly Detection Service...")