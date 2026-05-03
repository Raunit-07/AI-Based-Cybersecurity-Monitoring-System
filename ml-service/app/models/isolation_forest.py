import joblib
import os
from app.core.config import settings
from app.utils.logger import logger


class ModelManager:
    _instance = None

    def __init__(self):
        self.model = None
        self.feature_names = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def load_model(self):
        try:
            if not os.path.exists(settings.MODEL_PATH):
                logger.error(
                    "Model file not found",
                    extra={"extra_info": {"model_path": settings.MODEL_PATH}},
                )
                raise FileNotFoundError(
                    f"Model file not found at {settings.MODEL_PATH}"
                )

            data = joblib.load(settings.MODEL_PATH)

            self.model = data.get("model")
            self.feature_names = data.get("feature_names", [])

            # ✅ DEBUG: confirm feature alignment
            if self.feature_names:
                logger.info(f"Model expects features: {self.feature_names}")
            else:
                logger.warning("⚠️ No feature_names found in model")

            logger.info("✅ Model loaded successfully")

        except Exception as e:
            logger.error(f"❌ Error loading model: {e}", exc_info=True)
            raise e

    def predict(self, features):
        if self.model is None:
            raise ValueError("Model is not loaded")

        if features is None or len(features[0]) == 0:
            raise ValueError("Invalid feature input")

        try:
            prediction = self.model.predict(features)  # -1 or 1
            score = self.model.decision_function(features)  # higher = normal

            logger.info(
                f"Prediction raw → pred={prediction[0]}, score={score[0]}"
            )

            return int(prediction[0]), float(score[0])

        except Exception as e:
            logger.error(f"❌ Prediction error: {e}", exc_info=True)
            raise e


model_manager = ModelManager.get_instance()