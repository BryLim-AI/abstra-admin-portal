"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function billCancelledPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingCancelled />
    </Suspense>
  );
}

function BillingCancelled() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const searchParams = useSearchParams();

  const amount = searchParams.get("amount");
  const requestReferenceNumber = searchParams.get("requestReferenceNumber");
  const tenant_id = searchParams.get("tenant_id");
  const billing_id = searchParams.get("billing_id");

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [message, setMessage] = useState("Processing your payment...");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    async function updateBillStatus() {
      try {
        await axios.post("/api/payment/update-bill-cancel", {
          tenant_id,
          requestReferenceNumber,
          amount,
          billing_id,
        });
        setMessage("Your payment Cancellation was Successful");
      } catch (error) {
        setMessage(`Failed to update payment status. ${error}`);
      } finally {
        setLoading(false);
      }
    }

    if (amount && requestReferenceNumber && tenant_id && billing_id) {
      updateBillStatus();
    }
  }, [amount, requestReferenceNumber, tenant_id, billing_id]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg text-center">
      <h2
        className={`text-2xl font-semibold mb-4 ${
          loading ? "text-yellow-600" : "text-red-600"
        }`}
      >
        {loading ? "Processing..." : "Payment Cancelled"}
      </h2>
      <p>{message}</p>

      <button
        onClick={() => router.push("/pages/tenant/my-unit")}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
