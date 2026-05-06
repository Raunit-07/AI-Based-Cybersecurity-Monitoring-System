import { useEffect, useState } from "react";
import {
    fetchSuspiciousIPs,
} from "../services/api";

/**
 * =====================================
 * Suspicious IPs Component
 * =====================================
 */
const SuspiciousIPs = () => {
    const [ips, setIps] = useState([]);
    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /**
     * =====================================
     * Load Suspicious IPs
     * =====================================
     */
    const loadIPs = async () => {
        try {
            setLoading(true);

            const data =
                await fetchSuspiciousIPs();

            setIps(data || []);
        } catch (err) {
            console.error(
                "Failed to load suspicious IPs:",
                err
            );

            setError(
                err?.message ||
                "Failed to fetch suspicious IPs"
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * =====================================
     * Initial Load
     * =====================================
     */
    useEffect(() => {
        loadIPs();

        /**
         * Auto refresh every 15 sec
         */
        const interval = setInterval(
            loadIPs,
            15000
        );

        return () =>
            clearInterval(interval);
    }, []);

    /**
     * =====================================
     * Severity Colors
     * =====================================
     */
    const getSeverityStyles = (
        severity
    ) => {
        switch (
        severity?.toLowerCase()
        ) {
            case "critical":
                return "bg-red-500/20 text-red-400 border-red-500/40";

            case "high":
                return "bg-orange-500/20 text-orange-400 border-orange-500/40";

            case "medium":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";

            default:
                return "bg-green-500/20 text-green-400 border-green-500/40";
        }
    };

    /**
     * =====================================
     * Loading State
     * =====================================
     */
    if (loading) {
        return (
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
                <h2 className="text-xl font-semibold text-white mb-4">
                    Suspicious IPs
                </h2>

                <p className="text-gray-400">
                    Loading suspicious IPs...
                </p>
            </div>
        );
    }

    /**
     * =====================================
     * Error State
     * =====================================
     */
    if (error) {
        return (
            <div className="bg-[#111827] border border-red-500/30 rounded-2xl p-5">
                <h2 className="text-xl font-semibold text-white mb-4">
                    Suspicious IPs
                </h2>

                <p className="text-red-400">
                    {error}
                </p>
            </div>
        );
    }

    /**
     * =====================================
     * Empty State
     * =====================================
     */
    if (!ips.length) {
        return (
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
                <h2 className="text-xl font-semibold text-white mb-4">
                    Suspicious IPs
                </h2>

                <p className="text-gray-400">
                    No suspicious IPs detected
                </p>
            </div>
        );
    }

    /**
     * =====================================
     * Main Render
     * =====================================
     */
    return (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">
                    Suspicious IPs
                </h2>

                <span className="text-sm text-gray-400">
                    {ips.length} detected
                </span>
            </div>

            {/* IP List */}
            <div className="space-y-4">
                {ips.map((ipData) => (
                    <div
                        key={ipData.ip}
                        className="border border-gray-700 rounded-xl p-4 bg-[#0f172a]"
                    >
                        {/* Top Row */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <p className="text-gray-400 text-sm">
                                    IP Address
                                </p>

                                <h3 className="text-lg font-semibold text-white break-all">
                                    {ipData.ip}
                                </h3>
                            </div>

                            {/* Severity Badge */}
                            <div
                                className={`px-3 py-1 rounded-full border text-sm font-medium w-fit ${getSeverityStyles(
                                    ipData.severity
                                )}`}
                            >
                                {ipData.severity}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                            <div>
                                <p className="text-gray-400 text-sm">
                                    Attacks
                                </p>

                                <p className="text-white font-semibold">
                                    {ipData.attackCount}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">
                                    Threat Score
                                </p>

                                <p className="text-white font-semibold">
                                    {ipData.threatScore}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">
                                    Status
                                </p>

                                <p
                                    className={`font-semibold ${ipData.status ===
                                            "blocked"
                                            ? "text-red-400"
                                            : "text-yellow-400"
                                        }`}
                                >
                                    {ipData.status}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">
                                    Avg Score
                                </p>

                                <p className="text-white font-semibold">
                                    {ipData.avgAnomalyScore ??
                                        "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* Attack Types */}
                        {!!ipData.attackTypes
                            ?.length && (
                                <div className="mt-5">
                                    <p className="text-gray-400 text-sm mb-2">
                                        Attack Types
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {ipData.attackTypes.map(
                                            (type) => (
                                                <span
                                                    key={type}
                                                    className="px-2 py-1 text-xs rounded-lg bg-gray-800 text-gray-300 border border-gray-700"
                                                >
                                                    {type}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Last Seen */}
                        <div className="mt-5 text-sm text-gray-500">
                            Last Seen:{" "}
                            {ipData.latestAttack
                                ? new Date(
                                    ipData.latestAttack
                                ).toLocaleString()
                                : "Unknown"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SuspiciousIPs;