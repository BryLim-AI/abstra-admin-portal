"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface OverduePayment {
    total_overdue: number;
    overdue_count: number;
}

interface OverduePaymentWidgetProps {
    agreement_id: number;
}

export default function OverduePaymentWidget({ agreement_id }: OverduePaymentWidgetProps) {
    const [overdue, setOverdue] = useState<OverduePayment | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOverdue() {
            try {
                const response = await axios.get<{ overdue: OverduePayment }>(
                    `/api/tenant/dashboard/getOverDuePayments?agreement_id=${agreement_id}`
                );
                setOverdue(response.data.overdue);
            } catch (err: any) {
                console.error("Error fetching overdue payments:", err);
                setError(err.response?.data?.message || "Failed to fetch overdue payments.");
            } finally {
                setLoading(false);
            }
        }

        if (agreement_id) fetchOverdue();
    }, [agreement_id]);

    if (loading) return <p>Loading overdue payments...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!overdue) return <p>No overdue payments found.</p>;

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Overdue Payments</h2>

            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Overdue Amount</span>
                    <span className="text-red-600 font-bold">₱{overdue.total_overdue}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Number of Overdue Bills</span>
                    <span className="text-gray-800 font-medium">{overdue.overdue_count}</span>
                </div>
            </div>
        </div>
    );
}
