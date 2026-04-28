from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "AnomalyDetectionService"
    API_V1_STR: str = "/api/v1"
    DEBUG_MODE: bool = False
    MODEL_PATH: str = os.path.join("artifacts", "model.joblib")
    RATE_LIMIT: str = "100/minute"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
