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
                logger.error("Model file not found", extra={"extra_info": {"model_path": settings.MODEL_PATH}})
                raise FileNotFoundError(f"Model file not found at {settings.MODEL_PATH}")
                
            data = joblib.load(settings.MODEL_PATH)
            self.model = data.get("model")
            self.feature_names = data.get("feature_names", [])
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise e

    def predict(self, features):
        if self.model is None:
            raise ValueError("Model is not loaded")
        # Ensure features are in the right shape (1, n_features)
        # Assuming features is a numpy array or list of lists
        prediction = self.model.predict(features)
        # Isolation Forest: -1 for anomaly, 1 for normal
        # We also want the anomaly score
        score = self.model.decision_function(features)
        return prediction[0], score[0]

model_manager = ModelManager.get_instance()
