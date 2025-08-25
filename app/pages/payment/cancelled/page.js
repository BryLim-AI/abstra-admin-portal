'use client'
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";

const SearchParamsWrapper = ({ setRequestReferenceNumber, setLandlordId }) => {
    const searchParams = useSearchParams();
    const requestReferenceNumber = searchParams.get("requestReferenceNumber");
    const landlord_id = searchParams.get("landlord_id");

    useEffect(() => {
        setRequestReferenceNumber(requestReferenceNumber);
        setLandlordId(landlord_id);
    }, [requestReferenceNumber, landlord_id, setRequestReferenceNumber, setLandlordId]);

    return null;
};

function PaymentCancelledPage() {
    const router = useRouter();
    const [requestReferenceNumber, setRequestReferenceNumber] = useState(null);
    const [landlord_id, setLandlordId] = useState(null);
    const [message, setMessage] = useState("Are you sure you want to cancel the subscription?");
    const [isCancelled, setIsCancelled] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleCancelSubscription() {
        if (!requestReferenceNumber || !landlord_id) {
            setMessage("Missing request reference or landlord ID.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("/api/payment/cancel", {
                requestReferenceNumber,
                landlord_id,
            });

            setMessage(response.data.message);
            setIsCancelled(true);
        } catch (error) {
            setMessage("Failed to cancel subscription.");
            console.error("🚨 Error cancelling subscription:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Suspense fallback={<div>Loading cancellation details...</div>}>
            <SearchParamsWrapper setRequestReferenceNumber={setRequestReferenceNumber} setLandlordId={setLandlordId} />
            <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg text-center">
                <h2 className="text-2xl font-semibold mb-4 text-red-600">❌ Payment Cancelled</h2>
                <p>{message}</p>

                {!isCancelled ? (
                    <div className="mt-4">
                        <button
                            onClick={handleCancelSubscription}
                            disabled={loading}
                            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 mr-2"
                        >
                            {loading ? "Processing..." : "Confirm Cancellation"}
                        </button>
                        <button
                            onClick={() => router.push("/pages/landlord/subscription")}
                            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                            Go Back
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => router.push("/pages/landlord/sub_two/subscription")}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Go Back to Subscriptions
                    </button>
                )}
            </div>
        </Suspense>
    );
}

export default PaymentCancelledPage;

