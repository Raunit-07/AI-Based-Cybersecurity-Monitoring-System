import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";

const useAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({
        activeThreats: 0,
        criticalAlerts: 0,
        totalRequests: 0,
        monitoredIPs: 0,
    });

    useEffect(() => {
        const socket = getSocket();

        socket.on("connect", () => {
            console.log("✅ Connected to backend");
        });

        // 🚨 RECEIVE ALERT
        socket.on("new_alert", (data) => {
            console.log("🚨 New Alert:", data);

            setAlerts((prev) => [data, ...prev].slice(0, 10));

            // 🔥 UPDATE STATS
            setStats((prev) => ({
                ...prev,
                activeThreats: prev.activeThreats + 1,
                criticalAlerts:
                    data.attack_type === "ddos" ? prev.criticalAlerts + 1 : prev.criticalAlerts,
                monitoredIPs: prev.monitoredIPs + 1,
            }));
        });

        // 📊 LIVE TRAFFIC
        socket.on("traffic_update", (data) => {
            setStats((prev) => ({
                ...prev,
                totalRequests: data.requests,
            }));
        });

        return () => socket.disconnect();
    }, []);

    return { alerts, stats };
};

export default useAlerts;