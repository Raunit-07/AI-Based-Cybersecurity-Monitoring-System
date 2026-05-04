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

        // ================= CONNECTION =================
        const handleConnect = () => {
            console.log("✅ Connected to backend:", socket.id);
        };

        // ================= ALERT HANDLER =================
        const handleNewAlert = (data) => {
            console.log("🚨 RECEIVED ALERT:", data);

            if (!data || !data.id) return;

            // ✅ Normalize alert (MATCH BACKEND FORMAT)
            const formattedAlert = {
                id: data.id,
                type: data.type,
                severity: data.severity,
                source: data.source,
                time: data.time,
                status: "active",
            };

            // ✅ Update alerts list (limit to 10)
            setAlerts((prev) => [formattedAlert, ...prev].slice(0, 10));

            // ✅ Update stats safely
            setStats((prev) => ({
                ...prev,
                activeThreats: prev.activeThreats + 1,
                criticalAlerts:
                    data.type === "ddos"
                        ? prev.criticalAlerts + 1
                        : prev.criticalAlerts,
                monitoredIPs: prev.monitoredIPs + 1,
            }));
        };

        // ================= TRAFFIC HANDLER =================
        const handleTrafficUpdate = (data) => {
            console.log("📊 RECEIVED TRAFFIC:", data);

            if (!data || typeof data.requests !== "number") return;

            setStats((prev) => ({
                ...prev,
                totalRequests: data.requests,
            }));
        };

        // ================= ATTACH EVENTS =================
        socket.on("connect", handleConnect);
        socket.on("new_alert", handleNewAlert);
        socket.on("traffic_update", handleTrafficUpdate);

        // ================= CLEANUP =================
        return () => {
            socket.off("connect", handleConnect);
            socket.off("new_alert", handleNewAlert);
            socket.off("traffic_update", handleTrafficUpdate);
        };
    }, []);

    return { alerts, stats };
};

export default useAlerts;