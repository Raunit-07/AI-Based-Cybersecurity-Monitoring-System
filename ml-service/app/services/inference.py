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
    MUST match training features:
    [requests, failed_logins, method_encoded, endpoint_length]
    """

    requests = getattr(request, "requests", 0)
    failed_logins = getattr(request, "failedLogins", 0)

    method = getattr(request, "method", "GET")
    endpoint = getattr(request, "endpoint", "/")

    method_encoded = METHOD_MAP.get(method, 0)
    endpoint_length = len(endpoint)

    features = np.array([
        [requests, failed_logins, method_encoded, endpoint_length]
    ])

    return features


# ================= ATTACK TYPE =================
def determine_attack_type(
    is_anomaly: bool, request_count: int, failed_logins: int
) -> str:
    if not is_anomaly:
        return "normal"

    # 🔴 Priority-based classification
    if failed_logins >= 20:
        return "bruteforce"

    if request_count >= 1000:
        return "ddos"

    return "suspicious"


# ================= MAIN PIPELINE =================
def run_prediction_pipeline(request: PredictionRequest):
    try:
        # 🔹 Step 1: Preprocess
        features = preprocess(request)

        # 🔹 Step 2: ML Prediction
        prediction, score = model_manager.predict(features)

        logger.info(f"Prediction raw → pred={prediction}, score={score}")

        # 🔥 Step 3: HYBRID DETECTION (CRITICAL FIX)
        is_anomaly = False

        # 🟢 Rule 0: Safe normal traffic (VERY IMPORTANT)
        if request.requests < 100 and request.failedLogins < 5:
            is_anomaly = False

        # 🔴 Rule 1: DDoS detection
        elif request.requests >= 1000:
            is_anomaly = True

        # 🔴 Rule 2: Brute-force detection
        elif request.failedLogins >= 20:
            is_anomaly = True

        # 🧠 Rule 3: ML fallback (controlled)
        elif prediction == -1 and request.requests > 200:
            is_anomaly = True

        # 🔥 Step 4: Stable anomaly score
        normalized_score = 0.05

        if is_anomaly:
            normalized_score = float(min(max(-score * 5, 0.4), 1))

        # 🔹 Step 5: Attack classification
        attack_type = determine_attack_type(
            is_anomaly,
            request.requests,
            request.failedLogins,
        )

        # 🔹 Step 6: Logging
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

        # 🔹 Step 7: Response
        return PredictionData(
            anomaly_score=normalized_score,
            is_anomaly=is_anomaly,
            attack_type=attack_type,
        )

    except Exception as e:
        logger.error("❌ Error in prediction pipeline", exc_info=True)
        raise e