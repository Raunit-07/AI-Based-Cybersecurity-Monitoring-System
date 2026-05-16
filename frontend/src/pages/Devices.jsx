import React, {
    useEffect,
    useState,
} from "react";

import API from "../services/api";

/**
 * ==================================================
 * DEVICES PAGE
 * ==================================================
 */
const Devices = () => {
    const [devices, setDevices] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    /**
     * ==================================================
     * FETCH DEVICES
     * ==================================================
     */
    const fetchDevices =
        async () => {
            try {
                const response =
                    await API.get(
                        "/devices"
                    );

                const deviceList =
                    response?.data
                        ?.devices || [];

                setDevices(deviceList);
            } catch (error) {
                console.error(
                    "❌ Failed to fetch devices:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

    /**
     * ==================================================
     * INITIAL LOAD
     * ==================================================
     */
    useEffect(() => {
        fetchDevices();
    }, []);

    /**
     * ==================================================
     * STATUS COLOR
     * ==================================================
     */
    const getStatusColor =
        (status) => {
            switch (status) {
                case "online":
                    return "bg-green-500";

                case "offline":
                    return "bg-red-500";

                default:
                    return "bg-yellow-500";
            }
        };

    /**
     * ==================================================
     * RISK LEVEL
     * ==================================================
     */
    const getRiskLevel =
        (score = 0) => {
            if (score >= 80)
                return "Critical";

            if (score >= 60)
                return "High";

            if (score >= 30)
                return "Medium";

            return "Low";
        };

    /**
     * ==================================================
     * LOADING
     * ==================================================
     */
    if (loading) {
        return (
            <div className="p-6 text-gray-400">
                Loading devices...
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">

            {/* ==================================================
          HEADER
      ================================================== */}
            <div>
                <h1 className="text-3xl font-bold text-white">
                    Endpoint Devices
                </h1>

                <p className="text-gray-400 mt-2">
                    Monitor registered
                    endpoint agents and
                    device health.
                </p>
            </div>

            {/* ==================================================
          DEVICES TABLE
      ================================================== */}
            <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="w-full">

                        {/* ==================================================
                TABLE HEADER
            ================================================== */}
                        <thead className="bg-[#1F2937] text-gray-300">
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    Hostname
                                </th>

                                <th className="px-6 py-4 text-left">
                                    Status
                                </th>

                                <th className="px-6 py-4 text-left">
                                    Operating System
                                </th>

                                <th className="px-6 py-4 text-left">
                                    Last Seen
                                </th>

                                <th className="px-6 py-4 text-left">
                                    Threats
                                </th>

                                <th className="px-6 py-4 text-left">
                                    Risk Level
                                </th>
                            </tr>
                        </thead>

                        {/* ==================================================
                TABLE BODY
            ================================================== */}
                        <tbody>

                            {devices.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-8 text-center text-gray-500"
                                    >
                                        No devices found
                                    </td>
                                </tr>
                            )}

                            {devices.map(
                                (device) => (
                                    <tr
                                        key={
                                            device._id
                                        }

                                        className="border-t border-gray-800 hover:bg-[#1A2234] transition"
                                    >

                                        {/* HOSTNAME */}
                                        <td className="px-6 py-4 text-white font-medium">
                                            {
                                                device.hostname
                                            }
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">

                                                <div
                                                    className={`w-3 h-3 rounded-full ${getStatusColor(
                                                        device.status
                                                    )}`}
                                                />

                                                <span className="text-gray-300 capitalize">
                                                    {
                                                        device.status
                                                    }
                                                </span>
                                            </div>
                                        </td>

                                        {/* OS */}
                                        <td className="px-6 py-4 text-gray-300">
                                            {
                                                device.os
                                            }
                                        </td>

                                        {/* LAST SEEN */}
                                        <td className="px-6 py-4 text-gray-400">
                                            {device.lastSeen
                                                ? new Date(
                                                    device.lastSeen
                                                ).toLocaleString()
                                                : "Never"}
                                        </td>

                                        {/* THREATS */}
                                        <td className="px-6 py-4 text-red-400 font-semibold">
                                            {device.threatCount ||
                                                0}
                                        </td>

                                        {/* RISK */}
                                        <td className="px-6 py-4">

                                            <span className="px-3 py-1 rounded-full text-sm bg-red-500/10 text-red-400 border border-red-500/20">
                                                {getRiskLevel(
                                                    device.riskScore
                                                )}
                                            </span>

                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Devices;