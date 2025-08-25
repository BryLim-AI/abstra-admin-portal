"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Load ApexCharts dynamically (avoid SSR issues)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface UtilityTrendsChartProps {
    landlordId: string;
    propertyId?: string; // optional for filtering
}

export default function UtilityTrendsChart({ landlordId, propertyId }: UtilityTrendsChartProps) {
    const [utilityTrend, setUtilityTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlordId) return;

        setLoading(true);

        // Build query params
        const queryParams = new URLSearchParams({ landlord_id: landlordId });
        if (propertyId && propertyId !== "all") {
            queryParams.append("property_id", propertyId);
        }

        fetch(`/api/analytics/landlord/getMonthlyUtilityTrends?${queryParams.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                setUtilityTrend(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching utility trend:", error);
                setLoading(false);
            });
    }, [landlordId, propertyId]);

    // Extract months
    const monthsUtility = [...new Set(utilityTrend.map((item: any) => item.month))];

    // Water and electricity datasets
    // @ts-ignore
    const waterData = monthsUtility.map(
        (month) =>
            utilityTrend.find(
                (item: any) => item.month === month && item.utility_type === "water"
            )?.total_expense || 0
    );

    // @ts-ignore
    const electricityData = monthsUtility.map(
        (month) =>
            utilityTrend.find(
                (item: any) => item.month === month && item.utility_type === "electricity"
            )?.total_expense || 0
    );

    const chartOptions = {
        chart: { type: "line" as const },
        xaxis: { categories: monthsUtility },
        title: { text: "Monthly Utility Expenses Trend", align: "center" as const },
    };

    const chartSeries = [
        { name: "Water", data: waterData },
        { name: "Electricity", data: electricityData },
    ];

    if (loading) {
        return <p className="text-gray-500">Loading utility trends...</p>;
    }

    return (
        <div>
            <Chart
                options={chartOptions}
                series={chartSeries}
                type="line"
                height={350}
            />
        </div>
    );
}
