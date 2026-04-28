import pandas as pd
import numpy as np
from app.schemas.predict import PredictionRequest, PredictionResponse, PredictionData
from app.models.isolation_forest import model_manager
from app.utils.logger import logger

# Mapping of HTTP methods to numerical values (simplified example of feature engineering)
METHOD_MAP = {
    "GET": 1,
    "POST": 2,
    "PUT": 3,
    "DELETE": 4,
    "PATCH": 5,
    "OPTIONS": 6,
    "HEAD": 7
}

def preprocess(request: PredictionRequest) -> np.ndarray:
    """
    Apply lightweight preprocessing to match the training data.
    Features:
    - request_count
    - method_encoded
    - (Additional features like endpoint length, etc. can be added)
    """
    method_encoded = METHOD_MAP.get(request.method, 0)
    endpoint_length = len(request.endpoint)
    
    # We will use these 3 features for the model
    features = np.array([[request.request_count, method_encoded, endpoint_length]])
    return features

def determine_attack_type(is_anomaly: bool, request_count: int) -> str:
    if not is_anomaly:
        return "Normal"
    if request_count > 100:
        return "DDoS / Brute-force"
    return "Unknown Anomaly"

def run_prediction_pipeline(request: PredictionRequest) -> PredictionResponse:
    try:
        features = preprocess(request)
        prediction, score = model_manager.predict(features)
        
        # -1 indicates anomaly in Isolation Forest
        is_anomaly = bool(prediction == -1)
        
        # IsolationForest decision_function returns negative values for anomalies and positive for normal points.
        # Let's normalize it to a 0-1 scale for the API output (higher = more anomalous)
        # A simple normalization for demonstration: 
        normalized_score = float(1.0 / (1.0 + np.exp(score)))
        
        attack_type = determine_attack_type(is_anomaly, request.request_count)
        
        logger.info("Prediction successful", extra={"extra_info": {
            "ip": request.ip,
            "is_anomaly": is_anomaly,
            "score": normalized_score
        }})
        
        return PredictionResponse(
            success=True,
            data=PredictionData(
                anomaly_score=normalized_score,
                is_anomaly=is_anomaly,
                attack_type=attack_type
            ),
            message="Prediction successful"
        )
    except Exception as e:
        logger.error("Error in prediction pipeline", exc_info=True)
        raise e
