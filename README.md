# AI-Based Cybersecurity Monitoring System

A production-grade AI-powered real-time threat detection system consisting of a React frontend, Node.js backend, and Python FastAPI ML microservice.

## 🧱 System Architecture

Frontend (React + Vite) → Backend (Node.js API) → ML Service (FastAPI)
↓
MongoDB
↓
Socket.IO (real-time)

## 📦 Services Overview

1. **Frontend**: React, Vite, Tailwind CSS, Chart.js, React Query. Displays real-time traffic and alerts.
2. **Backend**: Node.js, Express, MongoDB, Socket.IO. Handles log ingestion, auth (HttpOnly JWTs), and real-time broadcasting.
3. **ML Service**: Python, FastAPI, scikit-learn (Isolation Forest). Detects anomalies in real-time.

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB (running on `mongodb://127.0.0.1:27017` by default)
- Redis (Optional, but recommended)

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file from .env.example
npm start
```
*Backend runs on port 5000.*

### 2. ML Service Setup
```bash
cd ml-service
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*ML Service runs on port 8000.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on port 5173.*

## 🔒 Security Features
- JWTs stored in `HttpOnly` cookies.
- Helmet for HTTP headers.
- Rate limiting using `express-rate-limit`.
- Inputs validated and sanitized (express-validator & xss-clean).
- Passwords hashed with bcrypt.

## 🧪 Testing the Integration
To test the flow, send a mock malicious log to the backend:
```bash
curl -X POST http://localhost:5000/api/logs \
     -H "Content-Type: application/json" \
     -d '{"ip": "192.168.1.100", "requests": 5000, "failed_logins": 50}'
```
This will be processed by the backend, sent to the ML service, marked as an anomaly, saved to MongoDB, and broadcasted via Socket.IO to the React dashboard instantly.
