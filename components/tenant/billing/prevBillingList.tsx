"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function PreviousBilling({ agreement_id, user_id }) {
    const [billingData, setBillingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        if (!user_id) return;

        const fetchBillingData = async () => {
            try {
                const res = await axios.get("/api/tenant/billing/previousBilling", {
                    params: { agreement_id, user_id },
                });
                setBillingData(res.data.billings || []);
            } catch (err) {
                console.error("Error fetching previous billing:", err);
                // @ts-ignore
                setError("Failed to fetch previous billing.");
            } finally {
                setLoading(false);
            }
        };

        fetchBillingData();
    }, [agreement_id, user_id]);

    const handleDownload = (billing_id) => {
        router.push(`/pages/tenant/billing/viewPrevBilling?billing_id=${billing_id}`);
    };

    if (loading) return <p className="text-gray-500">Loading previous billing...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!billingData.length)
        return (
            <div className="text-gray-500 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                No previous billing records found.
            </div>
        );

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Previous Billings</h1>
            <div className="space-y-2">
                {billingData.map((bill) => (
                    <div
                        key={bill?.billing_id}
                        className="flex justify-between items-center p-4 bg-white rounded-lg shadow border"
                    >
                        <span className="text-gray-700">{bill?.billing_period}</span>
                        <button
                            onClick={() => handleDownload(bill?.billing_id)}
                            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            View
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
