
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";

const SearchParamsWrapper = ({ setRequestReferenceNumber, setLandlordId, setPlanName, setAmount }) => {
    const searchParams = useSearchParams();
    const requestReferenceNumber = searchParams.get("requestReferenceNumber");
    const landlord_id = searchParams.get("landlord_id");
    const plan_name = searchParams.get("plan_name");
    const amount = searchParams.get("amount");

    useEffect(() => {
        if (requestReferenceNumber && landlord_id && plan_name && amount) {
            setRequestReferenceNumber(requestReferenceNumber);
            setLandlordId(landlord_id);
            setPlanName(plan_name);
            setAmount(amount);
        }
    }, [requestReferenceNumber, landlord_id, plan_name, amount, setRequestReferenceNumber, setLandlordId, setPlanName, setAmount]);

    return null;
};

function PaymentSuccessPage() {
    const router = useRouter();
    const [requestReferenceNumber, setRequestReferenceNumber] = useState(null);
    const [landlord_id, setLandlordId] = useState(null);
    const [plan_name, setPlanName] = useState(null);
    const [amount, setAmount] = useState(null);
    const [message, setMessage] = useState("Processing your payment...");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function updateSubscriptionStatus() {
            if (!requestReferenceNumber || !landlord_id || !plan_name || !amount) {
                console.warn("Waiting for payment details...");
                return;
            }

            try {
                const response = await axios.post("/api/payment/status", {
                    requestReferenceNumber,
                    landlord_id,
                    plan_name,
                    amount,
                });

                setMessage(response.data.message || "Your subscription has been activated successfully.");
            } catch (error) {
                setMessage("Failed to activate subscription.");
                console.error("Error updating subscription:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        }

        if (requestReferenceNumber && landlord_id && plan_name && amount) {
            updateSubscriptionStatus();
        }
    }, [requestReferenceNumber, landlord_id, plan_name, amount]);

    return (
        <Suspense fallback={<div>Loading Payment Details...</div>}>
            <SearchParamsWrapper
                setRequestReferenceNumber={setRequestReferenceNumber}
                setLandlordId={setLandlordId}
                setPlanName={setPlanName}
                setAmount={setAmount}
            />
            <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg text-center">
                <h2 className={`text-2xl font-semibold mb-4 ${loading ? "text-yellow-600" : message.includes("❌") ? "text-red-600" : "text-green-600"}`}>
                    {loading ? "⏳ Processing..." : message.includes("❌") ? "❌ Payment Error" : "✅ Payment Successful"}
                </h2>
                <p>{message}</p>
                <button
                    onClick={() => router.push("/pages/landlord/dashboard")}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Go to Dashboard
                </button>
            </div>
        </Suspense>
    );
}

export default PaymentSuccessPage;
