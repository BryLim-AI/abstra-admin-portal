import React, { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LabelList,
    CartesianGrid,
} from "recharts";
import axios from "axios";

// @ts-ignore
const RevenuePerformanceChart = ({ landlordId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlordId) return;

        setLoading(true);
        axios
            .get(`/api/analytics/landlord/getRevenuePerformance?landlordId=${landlordId}`)
            .then((res) => {
                // @ts-ignore
                const formatted = res.data.map((item) => ({
                    month: item.month, // matches backend's "month"
                    revenue: Number(item.revenue),
                }));
                setData(formatted);
            })
            .catch((err) => {
                console.error("Error fetching revenue data", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [landlordId]);

    const formatCurrency = (value: number) => {
        if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
        if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`;
        return `₱${value}`;
    };

    if (loading) {
        return (
            <div className="p-4 bg-white rounded-2xl shadow text-center">
                <p className="text-gray-500">Loading revenue data...</p>
            </div>
        );
    }

    if (data.every((d) => d.revenue === 0)) {
        return (
            <div className="p-4 bg-white rounded-2xl shadow text-center">
                <p className="text-gray-500">No revenue data available for this period.</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-2xl shadow">
            <h2 className="text-lg font-bold mb-4">Revenue Performance Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} barSize={35}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatCurrency}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                    />
                    <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                        cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
                    />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[12, 12, 0, 0]}>
                        <LabelList
                            dataKey="revenue"
                            position="top"
                            formatter={(value: number) => formatCurrency(value)}
                            fill="#374151"
                            fontSize={12}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenuePerformanceChart;
