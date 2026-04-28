from pydantic import BaseModel, Field, ConfigDict
from typing import Literal

class PredictionRequest(BaseModel):
    ip: str = Field(..., description="IP address of the requester")
    request_count: int = Field(..., ge=0, description="Number of requests in the given window")
    endpoint: str = Field(..., description="API endpoint being accessed")
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"] = Field(..., description="HTTP method")
    timestamp: str = Field(..., description="ISO8601 timestamp")
    user_agent: str = Field(..., description="User-Agent string")

    model_config = ConfigDict(extra="forbid")

class PredictionData(BaseModel):
    anomaly_score: float
    is_anomaly: bool
    attack_type: str

class PredictionResponse(BaseModel):
    success: bool
    data: PredictionData
    message: str
