import dotenv from "dotenv";
dotenv.config(); // load .env

import { sendEmailAlert } from "./src/integrations/email.js";

const testEmail = async () => {
    try {
        console.log("🚀 Sending test email...");

        await sendEmailAlert({
            ip: "192.168.1.1",
            attack_type: "ddos",
            requests: 3000,
            failedLogins: 2,
            anomaly_score: 0.95,
            timestamp: new Date().toISOString()
        });

        console.log("✅ Test email function executed");
    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
};

testEmail();