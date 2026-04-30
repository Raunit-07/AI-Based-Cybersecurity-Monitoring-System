const axios = require('axios');

const API_URL = 'http://localhost:5000/api/logs';

const endpoints = ['/api/login', '/api/users', '/api/products', '/api/checkout', '/api/settings', '/api/search'];
const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const ips = ['192.168.1.10', '10.0.0.5', '172.16.0.100', '45.33.22.11', '8.8.8.8'];

async function sendLog(isAnomaly = false) {
    const payload = {
        sourceIp: isAnomaly ? '45.33.22.11' : ips[Math.floor(Math.random() * ips.length)],
        method: isAnomaly ? 'POST' : methods[Math.floor(Math.random() * methods.length)],
        endpoint: isAnomaly ? '/api/login' : endpoints[Math.floor(Math.random() * endpoints.length)],
        requestCount: isAnomaly ? Math.floor(Math.random() * 500) + 100 : Math.floor(Math.random() * 20) + 1,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        payload: isAnomaly ? { username: 'admin', password: "' OR 1=1 --" } : { query: 'test' },
        timestamp: new Date().toISOString()
    };

    try {
        const response = await axios.post(API_URL, payload);
        const score = response.data?.data?.log?.anomalyScore || 0;
        console.log(`[${response.status}] Sent ${payload.method} ${payload.endpoint} | Score: ${score} | ${isAnomaly ? 'ANOMALY' : 'NORMAL'}`);
    } catch (error) {
        console.error(`Error sending log: ${error.message}`);
    }
}

async function run() {
    console.log('--- Traffic Simulation Started ---');
    console.log('Sending logs to:', API_URL);
    console.log('Press Ctrl+C to stop');
    
    setInterval(() => {
        const isAnomaly = Math.random() < 0.15; // 15% anomalies
        sendLog(isAnomaly);
    }, 2500);
}

run();
