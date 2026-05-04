import requests

url = "http://localhost:8000/api/v1/predict"

payload = {
    "ip": "192.168.1.1",
    "requests": 2000,
    "failedLogins": 5,
    "method": "GET",
    "endpoint": "/api/data"
}

response = requests.post(url, json=payload)

print(response.json())