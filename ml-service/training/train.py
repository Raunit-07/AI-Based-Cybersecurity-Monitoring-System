import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
import sys

# Ensure proper import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings


# ================= DATA GENERATION =================
def generate_synthetic_data(n_samples=5000, anomaly_fraction=0.05):
    """
    Features MUST match inference exactly:
    [requests, failed_logins, method_encoded, endpoint_length]
    """

    n_anomalies = int(n_samples * anomaly_fraction)
    n_normal = n_samples - n_anomalies

    # ================= NORMAL TRAFFIC =================
    normal_requests = np.random.normal(loc=50, scale=20, size=n_normal)
    normal_failed_logins = np.random.poisson(lam=1, size=n_normal)
    normal_method = np.random.choice([1, 2], size=n_normal)  # GET, POST
    normal_endpoint_len = np.random.normal(loc=20, scale=5, size=n_normal)

    normal_data = np.column_stack((
        normal_requests,
        normal_failed_logins,
        normal_method,
        normal_endpoint_len
    ))

    # ================= ANOMALY TRAFFIC =================
    anomaly_requests = np.random.normal(loc=1500, scale=500, size=n_anomalies)
    anomaly_failed_logins = np.random.poisson(lam=30, size=n_anomalies)
    anomaly_method = np.random.choice([3, 4, 5, 6, 7], size=n_anomalies)
    anomaly_endpoint_len = np.random.normal(loc=60, scale=20, size=n_anomalies)

    anomaly_data = np.column_stack((
        anomaly_requests,
        anomaly_failed_logins,
        anomaly_method,
        anomaly_endpoint_len
    ))

    # ================= COMBINE =================
    X = np.vstack((normal_data, anomaly_data))

    # Clean invalid values
    X[X < 0] = 0

    # Shuffle
    indices = np.random.permutation(n_samples)
    X = X[indices]

    return X


# ================= TRAIN MODEL =================
def train_and_save_model():
    print("🚀 Generating synthetic data...")
    X = generate_synthetic_data()

    print(f"📊 Training on {X.shape[0]} samples with {X.shape[1]} features")

    # ================= SCALING =================
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ================= MODEL =================
    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_scaled)

    # ================= SAVE =================
    os.makedirs(os.path.dirname(settings.MODEL_PATH), exist_ok=True)

    model_data = {
        "model": model,
        "scaler": scaler,
        "feature_names": [
            "requests",
            "failed_logins",
            "method_encoded",
            "endpoint_length"
        ]
    }

    joblib.dump(model_data, settings.MODEL_PATH)

    print(f"✅ Model saved at {settings.MODEL_PATH}")


# ================= ENTRY =================
if __name__ == "__main__":
    train_and_save_model()