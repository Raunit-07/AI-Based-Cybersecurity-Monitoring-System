import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
import sys

# Ensure proper import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings


# ================= CONFIG =================
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)


# ================= DATA GENERATION =================
def generate_synthetic_data(n_samples=5000, anomaly_fraction=0.05):
    """
    Features:
    [requests, failed_logins, method_encoded, endpoint_length]
    """

    n_anomalies = int(n_samples * anomaly_fraction)
    n_normal = n_samples - n_anomalies

    # ================= NORMAL TRAFFIC =================
    normal_requests = np.random.normal(loc=80, scale=25, size=n_normal)
    normal_failed_logins = np.random.poisson(lam=2, size=n_normal)
    normal_method = np.random.choice([1, 2], size=n_normal)  # GET, POST
    normal_endpoint_len = np.random.normal(loc=15, scale=4, size=n_normal)

    # ================= ANOMALY TRAFFIC =================
    anomaly_requests = np.random.normal(loc=2000, scale=600, size=n_anomalies)
    anomaly_failed_logins = np.random.poisson(lam=40, size=n_anomalies)
    anomaly_method = np.random.choice([3, 4, 5, 6, 7], size=n_anomalies)
    anomaly_endpoint_len = np.random.normal(loc=50, scale=15, size=n_anomalies)

    # ================= STACK =================
    normal_data = np.column_stack((
        normal_requests,
        normal_failed_logins,
        normal_method,
        normal_endpoint_len
    ))

    anomaly_data = np.column_stack((
        anomaly_requests,
        anomaly_failed_logins,
        anomaly_method,
        anomaly_endpoint_len
    ))

    X = np.vstack((normal_data, anomaly_data))

    # ================= CLEAN =================
    X = np.clip(X, a_min=0, a_max=None)

    # Shuffle
    np.random.shuffle(X)

    return X


# ================= TRAIN =================
def train_and_save_model():
    print("🚀 Generating synthetic data...")
    X = generate_synthetic_data()

    print(f"📊 Training on {X.shape[0]} samples with {X.shape[1]} features")

    # ================= SCALER =================
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ================= MODEL =================
    model = IsolationForest(
        n_estimators=300,
        contamination=0.05,
        random_state=RANDOM_SEED,
        n_jobs=-1
    )

    model.fit(X_scaled)

    # ================= VALIDATION (BASIC CHECK) =================
    scores = model.decision_function(X_scaled)
    print(f"📈 Score range → min: {scores.min():.4f}, max: {scores.max():.4f}")

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
        ],
        "version": "1.1"
    }

    joblib.dump(model_data, settings.MODEL_PATH)

    print(f"✅ Model saved at {settings.MODEL_PATH}")


# ================= ENTRY =================
if __name__ == "__main__":
    train_and_save_model()