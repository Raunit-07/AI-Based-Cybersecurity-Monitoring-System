import numpy as np
from app.schemas.predict import PredictionRequest, PredictionData
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
    "HEAD": 7,
}


# ================= PREPROCESS =================
def preprocess(request: PredictionRequest) -> np.ndarray:
    """
    Convert request into model features safely
    """

    # ✅ Input validation
    if request.requests < 0 or request.failedLogins < 0:
        raise ValueError("Invalid input: negative values not allowed")

    requests = request.requests
    failed_logins = request.failedLogins

    method = request.method
    endpoint = request.endpoint

    method_encoded = METHOD_MAP.get(method, 0)
    endpoint_length = len(endpoint)

    # ✅ IMPORTANT: MUST MATCH TRAINING FEATURES
    features = np.array(
        [[requests, failed_logins, method_encoded, endpoint_length]]
    )

    logger.info(f"Generated features: {features.tolist()}")

    return features


# ================= ATTACK TYPE =================
def determine_attack_type(
    is_anomaly: bool, request_count: int, failed_logins: int
) -> str:
    if not is_anomaly:
        return "normal"

    if failed_logins >= 20:
        return "bruteforce"

    if request_count >= 500:
        return "ddos"

    return "suspicious"


# ================= MAIN PIPELINE =================
def run_prediction_pipeline(request: PredictionRequest):
    try:
        features = preprocess(request)

        prediction, score = model_manager.predict(features)

        is_anomaly = prediction == -1

        # ✅ FIXED anomaly score logic
        normalized_score = float(-score)

        attack_type = determine_attack_type(
            is_anomaly,
            request.requests,
            request.failedLogins,
        )

        logger.info(
            "Prediction successful",
            extra={
                "extra_info": {
                    "ip": request.ip,
                    "is_anomaly": is_anomaly,
                    "score": normalized_score,
                    "attack_type": attack_type,
                }
            },
        )

        return PredictionData(
            anomaly_score=normalized_score,
            is_anomaly=is_anomaly,
            attack_type=attack_type,
        )

    except Exception as e:
        logger.error("❌ Error in prediction pipeline", exc_info=True)
        raise e