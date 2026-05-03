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
    docs_url="/docs",   # keep enabled for dev/debug
    redoc_url="/redoc"
)

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if hasattr(settings, "CORS_ORIGINS") else ["*"],
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
    return {
        "message": "ML Service Running ✅",
        "version": "1.0.0"
    }

# ================= HEALTH CHECK =================
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model_manager.model is not None
    }

# ================= STARTUP =================
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting Anomaly Detection Service...")

    try:
        # ✅ FIXED: Use env-based model path
        model_path = settings.MODEL_PATH

        logger.info(f"📂 Loading model from: {model_path}")

        if not os.path.exists(model_path):
            logger.error(f"❌ Model file not found at {model_path}")
            raise FileNotFoundError(f"Model not found at {model_path}")

        # ✅ Load model
        model_manager.load_model()

        # ✅ Extra validation
        if model_manager.model is None:
            raise RuntimeError("Model loaded but is None")

        logger.info("✅ Model loaded successfully and ready")

    except Exception as e:
        logger.error("❌ Failed to load model at startup", exc_info=True)

        # ⚠️ IMPORTANT:
        # Do NOT crash service, but system will return 503 in endpoints
        # This allows debugging instead of full crash

# ================= SHUTDOWN =================
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Shutting down Anomaly Detection Service...")