import joblib
import os
import numpy as np
from app.core.config import settings
from app.utils.logger import logger


class ModelManager:
    _instance = None

    def __init__(self):
        self.model = None
        self.scaler = None   # ✅ NEW
        self.feature_names = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    # ================= LOAD MODEL =================
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
            self.scaler = data.get("scaler")  # ✅ IMPORTANT
            self.feature_names = data.get("feature_names", [])

            # ================= VALIDATION =================
            if self.model is None:
                raise ValueError("❌ Model missing in saved file")

            if self.scaler is None:
                raise ValueError("❌ Scaler missing in saved file")

            if self.feature_names:
                logger.info(f"Model expects features: {self.feature_names}")
            else:
                logger.warning("⚠️ No feature_names found in model")

            logger.info("✅ Model and scaler loaded successfully")

        except Exception as e:
            logger.error(f"❌ Error loading model: {e}", exc_info=True)
            raise e

    # ================= PREDICT =================
    def predict(self, features):
        if self.model is None or self.scaler is None:
            raise ValueError("Model or scaler is not loaded")

        if features is None or len(features[0]) == 0:
            raise ValueError("Invalid feature input")

        try:
            # ================= VALIDATE SHAPE =================
            expected_features = len(self.feature_names)

            if features.shape[1] != expected_features:
                raise ValueError(
                    f"Feature mismatch: expected {expected_features}, got {features.shape[1]}"
                )

            # ================= SCALE FEATURES =================
            features_scaled = self.scaler.transform(features)

            # ================= PREDICT =================
            prediction = self.model.predict(features_scaled)  # -1 or 1
            score = self.model.decision_function(features_scaled)

            logger.info(
                f"Prediction raw → pred={prediction[0]}, score={score[0]}"
            )

            return int(prediction[0]), float(score[0])

        except Exception as e:
            logger.error(f"❌ Prediction error: {e}", exc_info=True)
            raise e


# ================= SINGLETON =================
model_manager = ModelManager.get_instance()