import { useEffect, useState } from "react";
import axios from "axios";

interface BillingSummary {
    total_due: number;
    paid_amount: number;
}

interface PaymentDueWidgetProps {
    agreement_id: number;
}

export default function PaymentDueWidget({ agreement_id }: PaymentDueWidgetProps) {
    const [billing, setBilling] = useState<BillingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBilling() {
            try {
                const response = await axios.get<{ billing: BillingSummary }>(
                    `/api/tenant/dashboard/getPaymentDue?agreement_id=${agreement_id}`
                );
                setBilling(response.data.billing);
            } catch (err: any) {
                console.error("Error fetching billing data:", err);
                setError(err.response?.data?.message || "Failed to fetch billing data.");
            } finally {
                setLoading(false);
            }
        }

        if (agreement_id) fetchBilling();
    }, [agreement_id]);

    if (loading) return <p>Loading payment details...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!billing) return <p>No billing information found.</p>;

    const { total_due, paid_amount } = billing;
    const remainingAmount = Math.max(total_due - paid_amount, 0);
    const progressPercent = total_due ? (paid_amount / total_due) * 100 : 0;

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Payment Amount Due</h2>

            {/* Remaining Amount Text */}
            <div className="text-right mb-2 text-gray-700">
                <span className="text-lg font-bold">₱{remainingAmount.toLocaleString()}</span> remaining of <span className="text-gray-600">₱{total_due.toLocaleString()}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                        remainingAmount <= total_due * 0.1 ? "bg-red-600" : remainingAmount <= total_due / 2 ? "bg-yellow-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
}
