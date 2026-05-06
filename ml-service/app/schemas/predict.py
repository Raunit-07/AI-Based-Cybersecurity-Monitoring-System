from pydantic import BaseModel, Field

# ================= REQUEST =================
class PredictionRequest(BaseModel):
    ip: str = Field(..., example="192.168.1.1")
    requests: int = Field(..., ge=0, example=120)
    failedLogins: int = Field(0, ge=0, example=5)

    # ✅ FIX: add missing fields (used in ML preprocessing)
    method: str = Field(default="GET", example="POST")
    endpoint: str = Field(default="/login", example="/api/login")


# ================= RESPONSE DATA =================
class PredictionData(BaseModel):
    anomaly_score: float
    is_anomaly: bool
    attackType: str


# ================= FULL RESPONSE =================
class PredictionResponse(BaseModel):
    success: bool
    data: PredictionData
    message: str