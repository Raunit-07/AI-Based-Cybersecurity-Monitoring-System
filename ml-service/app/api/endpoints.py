from fastapi import APIRouter, Request, HTTPException
from app.schemas.predict import PredictionRequest, PredictionResponse
from app.services.inference import run_prediction_pipeline
from app.core.security import limiter
from app.utils.logger import logger
from app.models.isolation_forest import model_manager

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
@limiter.limit("100/minute")
async def predict(request: Request, payload: PredictionRequest):
    """
    Predict anomaly based on incoming structured log data.
    """
    if model_manager.model is None:
        logger.error("❌ Model not loaded")
        raise HTTPException(status_code=503, detail="ML Model not loaded")

    try:
        result = run_prediction_pipeline(payload)

        return PredictionResponse(
        success=True,
        data=result,   # ✅ now correct
        message="Prediction successful"
        )

    except Exception as e:
        logger.error(f"❌ Prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Prediction error")


@router.get("/health")
async def health_check():
    return {"status": "ok", "message": "ML Service healthy"}