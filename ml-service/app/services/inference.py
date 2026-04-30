import numpy as np
from app.schemas.predict import PredictionRequest, PredictionResponse, PredictionData
from app.models.isolation_forest import model_manager
from app.utils.logger import logger

# ================= METHOD ENCODING =================
METHOD_MAP = {
    "GET": 1,
    "POST": 2,
    "PUT": 3,
    "DELETE": 4,
    "PATCH": 5,
    "OPTIONS": 6,
    "HEAD": 7
}

# ================= PREPROCESS =================
def preprocess(request: PredictionRequest) -> np.ndarray:
    """
    Convert request into model features safely
    """

    # ✅ Safe extraction (prevents crash)
    requests = getattr(request, "requests", 0)
    failed_logins = getattr(request, "failedLogins", 0)

    method = getattr(request, "method", "GET")
    endpoint = getattr(request, "endpoint", "/")

    method_encoded = METHOD_MAP.get(method, 0)
    endpoint_length = len(endpoint)

    # ✅ Final feature vector (IMPORTANT: must match training)
    features = np.array([
        [requests, failed_logins, method_encoded]
    ])

    return features


# ================= ATTACK TYPE =================
def determine_attack_type(is_anomaly: bool, request_count: int, failed_logins: int) -> str:
    if not is_anomaly:
        return "normal"

    if failed_logins > 10:
        return "bruteforce"

    if request_count > 1000:
        return "ddos"

    return "suspicious"


# ================= MAIN PIPELINE =================
def run_prediction_pipeline(request: PredictionRequest):
    try:
        features = preprocess(request)

        prediction, score = model_manager.predict(features)

        is_anomaly = bool(prediction == -1)

        normalized_score = float(1.0 / (1.0 + np.exp(score)))

        attack_type = determine_attack_type(
            is_anomaly,
            getattr(request, "requests", 0),
            getattr(request, "failedLogins", 0)
        )

        logger.info("Prediction successful", extra={
            "extra_info": {
                "ip": request.ip,
                "is_anomaly": is_anomaly,
                "score": normalized_score
            }
        })

        return PredictionData(
            anomaly_score=normalized_score,
            is_anomaly=is_anomaly,
            attack_type=attack_type
        )

    except Exception as e:
        logger.error("Error in prediction pipeline", exc_info=True)
        raise e