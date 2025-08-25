"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Payment {
    payment_id: number;
    payment_type: string;
    amount_paid: number;
    payment_status: string;
    payment_date: string;
    receipt_reference: string | null;
    method_name: string;
}

interface PaymentHistoryWidgetProps {
    agreement_id: number;
}

export default function PaymentHistoryWidget({ agreement_id }: PaymentHistoryWidgetProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPayments() {
            try {
                const response = await axios.get(`/api/tenant/payment/currentPaymentHistory?agreement_id=${agreement_id}`);
                setPayments(response.data.payments || []);
            } catch (err: any) {
                console.error("Error fetching payments:", err);
                setError("Failed to fetch payment history.");
            } finally {
                setLoading(false);
            }
        }

        if (agreement_id) fetchPayments();
    }, [agreement_id]);

    if (loading) return <p>Loading payment history...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (payments.length === 0) return <p>No payments made yet.</p>;

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 overflow-x-auto">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Payment History</h2>
            <table className="w-full table-auto text-sm text-gray-600">
                <thead>
                <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-right">Amount Paid</th>
                    <th className="px-4 py-2 text-left">Status</th>
                </tr>
                </thead>
                <tbody>
                {payments.map((p) => (
                    <tr key={p.payment_id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2">{new Date(p.payment_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{p.payment_type.replace("_", " ").toUpperCase()}</td>
                        <td className="px-4 py-2 text-right">₱{p.amount_paid.toLocaleString()}</td>
                        <td className={`px-4 py-2 font-medium ${
                            p.payment_status === "confirmed" ? "text-green-600" :
                                p.payment_status === "pending" ? "text-yellow-500" :
                                    "text-red-600"
                        }`}>
                            {p.payment_status.toUpperCase()}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
