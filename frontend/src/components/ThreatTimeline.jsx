import {
    useEffect,
    useState,
} from "react";

import api from "../services/api";

const ThreatTimeline = () => {
    const [timeline, setTimeline] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    /**
     * ================= FETCH TIMELINE =================
     */
    useEffect(() => {
        fetchTimeline();
    }, []);

    const fetchTimeline =
        async () => {
            try {
                setLoading(true);

                /**
                 * IMPORTANT:
                 * Axios interceptor already unwraps:
                 * response.data
                 */
                const response =
                    await api.get(
                        "/alerts/timeline"
                    );

                if (
                    response?.success
                ) {
                    const timelineData =
                        response?.data
                            ?.timeline || [];

                    setTimeline(
                        Array.isArray(
                            timelineData
                        )
                            ? timelineData
                            : []
                    );
                }
            } catch (error) {
                console.error(
                    "❌ Timeline fetch failed:",
                    error.message
                );

                setTimeline([]);
            } finally {
                setLoading(false);
            }
        };

    return (
        <div className="bg-[#0B1739] border border-[#1E2D5C] rounded-2xl p-5">
            {/* ================= HEADER ================= */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-white text-lg font-semibold">
                    Threat Timeline
                </h2>
            </div>

            {/* ================= CONTENT ================= */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {loading ? (
                    <p className="text-sm text-gray-400">
                        Loading timeline...
                    </p>
                ) : timeline.length ===
                    0 ? (
                    <p className="text-gray-400 text-sm">
                        No threat activity detected.
                    </p>
                ) : (
                    timeline.map(
                        (
                            item,
                            index
                        ) => (
                            <div
                                key={
                                    item.id ||
                                    index
                                }
                                className="border-l-2 border-red-500 pl-4 pb-4"
                            >
                                {/* ================= TOP ================= */}
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-white font-medium">
                                        {item.attackType ||
                                            "Unknown Threat"}
                                    </h3>

                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {new Date(
                                            item.timestamp ||
                                            item.createdAt
                                        ).toLocaleTimeString()}
                                    </span>
                                </div>

                                {/* ================= IP ================= */}
                                <p className="text-sm text-gray-300 mt-1">
                                    IP:{" "}
                                    {item.ip ||
                                        "Unknown"}
                                </p>

                                {/* ================= MESSAGE ================= */}
                                <p className="text-xs text-gray-400 mt-1">
                                    {item.message ||
                                        "Threat detected"}
                                </p>

                                {/* ================= RISK ================= */}
                                <p className="text-xs text-red-400 mt-1">
                                    Risk Score:{" "}
                                    {typeof item.anomalyScore ===
                                        "number"
                                        ? item.anomalyScore.toFixed(
                                            3
                                        )
                                        : "N/A"}
                                </p>

                                {/* ================= SEVERITY ================= */}
                                <div className="mt-2">
                                    <span
                                        className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wide font-medium ${item.severity ===
                                            "critical"
                                            ? "bg-red-600/20 text-red-400"
                                            : item.severity ===
                                                "high"
                                                ? "bg-orange-500/20 text-orange-300"
                                                : item.severity ===
                                                    "medium"
                                                    ? "bg-yellow-500/20 text-yellow-300"
                                                    : "bg-green-500/20 text-green-300"
                                            }`}
                                    >
                                        {item.severity ||
                                            "low"}
                                    </span>
                                </div>
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    );
};

export default ThreatTimeline;