"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PaymentsPerMonthChartProps {
    landlordId: string | number;
}

export default function PaymentsPerMonthChart({
                                                  landlordId,
                                              }: PaymentsPerMonthChartProps) {
    const [paymentData, setPaymentData] = useState<
        { month: string; total_received: number }[]
    >([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlordId) return;

        setLoading(true);
        fetch(`/api/analytics/landlord/getPaymentsperMonth?landlord_id=${landlordId}`)
            .then((res) => res.json())
            .then((data) => {
                setPaymentData(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching payment data:", error);
                setLoading(false);
            });
    }, [landlordId]);

    const chartOptions = {
        chart: { type: "bar" },
        xaxis: {
            categories: paymentData.map((item) => item.month),
        },
        title: { text: "Monthly Payments Received", align: "center" },
    };

    const chartSeries = [
        {
            name: "Total Payments Received",
            data: paymentData.map((item) => item.total_received),
        },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            {loading ? (
                <p className="text-gray-500 text-center">Loading...</p>
            ) : paymentData.length > 0 ? (
                <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="bar"
                    height={300}
                />
            ) : (
                <p className="text-gray-500 text-center">No data available</p>
            )}
        </div>
    );
}
