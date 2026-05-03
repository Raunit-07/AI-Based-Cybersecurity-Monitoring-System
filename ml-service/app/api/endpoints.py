from fastapi import APIRouter, Request, HTTPException, status
from app.schemas.predict import PredictionRequest, PredictionResponse
from app.services.inference import run_prediction_pipeline
from app.core.security import limiter
from app.utils.logger import logger
from app.models.isolation_forest import model_manager

router = APIRouter()


# ================= PREDICT ENDPOINT =================
@router.post("/predict", response_model=PredictionResponse)
@limiter.limit("100/minute")
async def predict(request: Request, payload: PredictionRequest):
    """
    Predict anomaly based on incoming structured log data.
    """

    # ✅ Log incoming request (important for debugging)
    logger.info(
        "Incoming prediction request",
        extra={
            "extra_info": {
                "ip": payload.ip,
                "requests": payload.requests,
                "failedLogins": payload.failedLogins,
                "method": payload.method,
                "endpoint": payload.endpoint,
            }
        },
    )

    # ❌ Model not loaded
    if model_manager.model is None:
        logger.error("❌ Model not loaded")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "success": False,
                "error": "ML model not loaded",
            },
        )

    try:
        result = run_prediction_pipeline(payload)

        return PredictionResponse(
            success=True,
            data=result,
            message="Prediction successful",
        )

    # ✅ Handle known validation errors
    except ValueError as ve:
        logger.warning(f"⚠️ Validation error: {ve}")

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": str(ve),
            },
        )

    # ❌ Unexpected errors
    except Exception as e:
        logger.error("❌ Prediction failed", exc_info=True)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": "Internal prediction error",
            },
        )


# ================= HEALTH CHECK =================
@router.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "ok",
        "model_loaded": model_manager.model is not None,
    }