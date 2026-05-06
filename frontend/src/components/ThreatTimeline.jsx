import { useEffect, useState } from "react";
import api from "../services/api";

const ThreatTimeline = () => {
    const [timeline, setTimeline] = useState([]);

    useEffect(() => {
        fetchTimeline();
    }, []);

    const fetchTimeline = async () => {
        try {
            const response = await api.get("/alerts/timeline");

            if (response.data?.success) {
                setTimeline(response.data.data || []);
            }
        } catch (error) {
            console.error("Timeline fetch failed:", error);
        }
    };

    return (
        <div className="bg-[#0B1739] border border-[#1E2D5C] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-white text-lg font-semibold">
                    Threat Timeline
                </h2>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {timeline.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                        No threat activity detected.
                    </p>
                ) : (
                    timeline.map((item, index) => (
                        <div
                            key={index}
                            className="border-l-2 border-red-500 pl-4 pb-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-medium">
                                    {item.attackType || "Unknown Threat"}
                                </h3>

                                <span className="text-xs text-gray-400">
                                    {new Date(item.createdAt).toLocaleTimeString()}
                                </span>
                            </div>

                            <p className="text-sm text-gray-300 mt-1">
                                IP: {item.ipAddress}
                            </p>

                            <p className="text-xs text-red-400 mt-1">
                                Risk Score: {item.riskScore}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ThreatTimeline;