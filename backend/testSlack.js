import dotenv from "dotenv";
dotenv.config();

import { sendSlackAlert } from "./src/integrations/slack.js";

const runTest = async () => {
    await sendSlackAlert({
        ip: "192.168.1.1",
        attack_type: "ddos",
        requests: 3000,
        failedLogins: 2,
        anomaly_score: 0.9
    });
};

runTest();