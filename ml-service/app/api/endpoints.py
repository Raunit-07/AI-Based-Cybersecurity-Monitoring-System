from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from app.schemas.predict import PredictionRequest, PredictionResponse
from app.services.inference import run_prediction_pipeline
from app.core.security import limiter
from app.utils.logger import logger

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
@limiter.limit("100/minute")
async def predict(request: Request, payload: PredictionRequest):
    """
    Predict anomaly based on incoming structured log data.
    """
    try:
        # Pass payload to the business logic
        # It's an async endpoint, but prediction is fast enough to be run synchronously.
        # If prediction was heavy, we would use run_in_threadpool
        response = run_prediction_pipeline(payload)
        return response
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during prediction")

@router.get("/health")
async def health_check():
    """
    Health check endpoint for Kubernetes/Docker/Node.js backend.
    """
    return {"status": "ok", "message": "Service is healthy"}
