import numpy as np

from app.schemas.predict import (
    PredictionRequest,
    PredictionData
)

from app.models.isolation_forest import (
    model_manager
)

from app.utils.logger import logger


# ============================================
# METHOD ENCODING
# ============================================

METHOD_MAP = {

    "GET": 1,
    "POST": 2,
    "PUT": 3,
    "DELETE": 4,
    "PATCH": 5,
    "OPTIONS": 6,
    "HEAD": 7

}


# ============================================
# PREPROCESS
# ============================================

def preprocess(
    request: PredictionRequest
) -> np.ndarray:


    request_count = max(

        0,

        getattr(
            request,
            "requests",
            0
        ) or 0

    )


    failed_count = max(

        0,

        getattr(
            request,
            "failedLogins",
            0
        ) or 0

    )


    method = getattr(

        request,

        "method",

        "GET"

    )


    endpoint = getattr(

        request,

        "endpoint",

        "/"

    )


    method_encoded = METHOD_MAP.get(

        str(method).upper(),

        0

    )


    endpoint_length = len(
        str(endpoint)
    )


    features = np.array([

        [

            request_count,

            failed_count,

            method_encoded,

            endpoint_length

        ]

    ])


    return features



# ============================================
# ATTACK TYPE
# ============================================

def determine_attack_type(

    is_anomaly: bool,

    request_count: int,

    failed_count: int

) -> str:


    if not is_anomaly:

        return "normal"


    if failed_count >= 20:

        return "bruteforce"


    if request_count >= 1000:

        return "ddos"


    if request_count >= 300:

        return "suspicious"


    return "suspicious"



# ============================================
# REASON
# ============================================

def determine_reason(

    request_count: int,

    failed_count: int,

    attack_type: str

) -> str:


    if attack_type == "ddos":

        return (

            f"High traffic detected "
            f"({request_count} requests)"

        )


    if attack_type == "bruteforce":

        return (

            f"Multiple failed logins "
            f"({failed_count})"

        )


    return "Unusual activity detected"



# ============================================
# NORMALIZE SCORE
# ============================================

def normalize_score(
    score: float
) -> float:


    score = abs(
        float(score or 0)
    )


    score = min(

        max(
            score,
            0
        ),

        1

    )


    return round(
        score,
        2
    )



# ============================================
# MAIN PIPELINE
# ============================================

def run_prediction_pipeline(

    request: PredictionRequest

):

    try:


        # ============================================
        # SAFE VALUES
        # ============================================

        request_count = max(

            0,

            request.requests or 0

        )


        failed_count = max(

            0,

            request.failedLogins or 0

        )


        # ============================================
        # PREPROCESS
        # ============================================

        features = preprocess(
            request
        )


        # ============================================
        # MODEL
        # ============================================

        prediction, raw_score = (

            model_manager.predict(
                features
            )

        )


        logger.info(

            f"ML raw: "
            f"pred={prediction}, "
            f"score={raw_score}"

        )


        # ============================================
        # HYBRID DETECTION
        # ============================================

        is_anomaly = False


        if (

            request_count < 100

            and

            failed_count < 5

        ):

            is_anomaly = False


        elif (

            request_count >= 1000

        ):

            is_anomaly = True


        elif (

            failed_count >= 20

        ):

            is_anomaly = True


        elif (

            prediction == -1

            and

            request_count > 200

        ):

            is_anomaly = True


        # ============================================
        # SCORE
        # ============================================

        anomaly_score = 0.05


        if is_anomaly:

            anomaly_score = normalize_score(

                abs(
                    raw_score
                ) * 3

            )


        # ============================================
        # ATTACK TYPE
        # ============================================

        attack_type = (

            determine_attack_type(

                is_anomaly,

                request_count,

                failed_count

            )

        )


        reason = determine_reason(

            request_count,

            failed_count,

            attack_type

        )


        confidence = min(

            max(

                int(
                    anomaly_score * 100
                ),

                0

            ),

            100

        )


        logger.info(

            "Prediction success",

            extra={

                "extra_info": {

                    "ip":
                    request.ip,

                    "is_anomaly":
                    is_anomaly,

                    "score":
                    anomaly_score,

                    "attack":
                    attack_type

                }

            }

        )


        return PredictionData(

            anomaly_score=
            anomaly_score,

            is_anomaly=
            is_anomaly,

            attackType=
            attack_type,

            confidence=
            confidence,

            reason=
            reason

        )


    except Exception:

        logger.error(

            "Prediction pipeline error",

            exc_info=True

        )

        raise