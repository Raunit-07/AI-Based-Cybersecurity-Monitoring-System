from pydantic import BaseModel

class PredictionRequest(BaseModel):
    ip: str
    requests: int
    failedLogins: int


class PredictionData(BaseModel):
    anomaly_score: float
    is_anomaly: bool
    attack_type: str


class PredictionResponse(BaseModel):
    success: bool
    data: PredictionData
    message: str