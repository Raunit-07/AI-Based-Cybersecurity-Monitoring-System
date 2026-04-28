import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os
import sys

# Ensure we can import app modules if needed
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings

def generate_synthetic_data(n_samples=5000, anomaly_fraction=0.05):
    """
    Generate synthetic log data for training.
    Features: [request_count, method_encoded, endpoint_length]
    """
    n_anomalies = int(n_samples * anomaly_fraction)
    n_normal = n_samples - n_anomalies

    # Normal data: low request count, typical methods, typical endpoint lengths
    normal_request_count = np.random.normal(loc=10, scale=5, size=n_normal)
    normal_method = np.random.choice([1, 2], size=n_normal) # GET/POST mostly
    normal_endpoint_len = np.random.normal(loc=20, scale=5, size=n_normal)

    normal_data = np.column_stack((normal_request_count, normal_method, normal_endpoint_len))

    # Anomaly data: high request count (DDoS/Brute-force), unusual methods
    anomaly_request_count = np.random.normal(loc=500, scale=100, size=n_anomalies)
    anomaly_method = np.random.choice([3, 4, 5, 6, 7], size=n_anomalies) # PUT/DELETE/etc
    anomaly_endpoint_len = np.random.normal(loc=50, scale=20, size=n_anomalies)

    anomaly_data = np.column_stack((anomaly_request_count, anomaly_method, anomaly_endpoint_len))

    # Combine and shuffle
    X = np.vstack((normal_data, anomaly_data))
    y = np.hstack((np.ones(n_normal), -1 * np.ones(n_anomalies))) # 1: normal, -1: anomaly
    
    # Clip negative values
    X[X < 0] = 0
    
    # Shuffle
    indices = np.random.permutation(n_samples)
    return X[indices], y[indices]

def train_and_save_model():
    print("Generating synthetic data...")
    X, _ = generate_synthetic_data()

    print(f"Training Isolation Forest on {X.shape[0]} samples...")
    # contamination is the expected proportion of outliers
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42, n_jobs=-1)
    model.fit(X)

    # Save model
    os.makedirs(os.path.dirname(settings.MODEL_PATH), exist_ok=True)
    
    model_data = {
        "model": model,
        "feature_names": ["request_count", "method_encoded", "endpoint_length"]
    }
    
    joblib.dump(model_data, settings.MODEL_PATH)
    print(f"Model saved successfully at {settings.MODEL_PATH}")

if __name__ == "__main__":
    train_and_save_model()
