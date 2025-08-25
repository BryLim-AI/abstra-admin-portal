"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function SecSucceedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SecSuccess />
    </Suspense>
  );
}

function SecSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const amount = searchParams.get("amount");
  const requestReferenceNumber = searchParams.get("requestReferenceNumber");
  const tenant_id = searchParams.get("tenant_id");
  const billing_id = searchParams.get("billing_id");

  const [message, setMessage] = useState("Processing your payment...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function updateBillStatus() {
      try {
        // Update Lease Agreement Payment Status
        await axios.post("/api/payment/update-bill-success", {
          tenant_id,
          billing_id,
          amount,
          requestReferenceNumber,
        });
        setMessage("Your payment was successful! Bill Update");
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
          loading ? "text-yellow-600" : "text-green-600"
        }`}
      >
        {loading ? "Processing..." : "Payment Successful"}
      </h2>
      <p>{message}</p>

      {!loading && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <h3 className="text-lg font-bold">Payment Receipt Invoice</h3>
          <p>
            <strong>Request Reference:</strong> {requestReferenceNumber}
          </p>
          <p>
            <strong>Amount Paid:</strong> ₱{parseFloat(amount).toLocaleString()}
          </p>
        </div>
      )}

      <button
        onClick={() => router.push("/pages/tenant/my-unit")}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
