"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MaintenanceCategoriesChartProps {
    landlordId: string | number;
}

export default function MaintenanceCategoriesChart({
                                                       landlordId,
                                                   }: MaintenanceCategoriesChartProps) {
    const [data, setData] = useState<{ category: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlordId) return;

        setLoading(true);
        fetch(`/api/analytics/landlord/getMaintenanceCategory?landlord_id=${landlordId}`)
            .then((res) => res.json())
            .then((result) => {
                if (result.categories) {
                    setData(result.categories);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching maintenance categories:", error);
                setLoading(false);
            });
    }, [landlordId]);

    const chartOptions = {
        chart: { type: "pie" },
        labels: data.map((item) => item.category),
        title: { text: "Maintenance Request Categories", align: "center" },
    };

    const chartSeries = data.map((item) => item.count);

    // @ts-ignore
    return (
        <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            {loading ? (
                <p className="text-gray-500 text-center">Loading...</p>
            ) : data.length > 0 ? (
                <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="pie"
                    height={300}
                />
            ) : (
                <p className="text-gray-500 text-center">No data available</p>
            )}
        </div>
    );
}
