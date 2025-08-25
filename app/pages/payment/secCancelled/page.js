"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";

export default function SecCancelledPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SecCancelled />
    </Suspense>
  );
}

function SecCancelled() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const agreement_id = searchParams.get("agreement_id");
  const payment_types = searchParams.get("payment_types");
  const totalAmount = searchParams.get("totalAmount");
  const requestReferenceNumber = searchParams.get("requestReferenceNumber");
  const status = searchParams.get("status");

  const [message, setMessage] = useState("Processing your payment...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  useEffect(() => {
    async function updateLeaseStatus() {
      if (
        !agreement_id ||
        !payment_types ||
        !totalAmount ||
        !requestReferenceNumber ||
        status !== "cancelled"
      ) {
        console.warn(" Missing required payment details. Waiting...");
        setMessage(
          "Could not process payment confirmation due to missing or invalid details."
        );
        setError("Invalid confirmation link or payment was not successful.");
        setLoading(false);
        return;
      }

      const paymentTypes = decodeURIComponent(payment_types).split(",");

      try {
        console.log("Updating lease status with:", {
          agreement_id,
          paymentTypes,
          totalAmount,
          requestReferenceNumber,
          status,
        });

        const response = await axios.post(
          "/api/payment/update-lease-cancelSecAdv",
          {
            agreement_id,
            paymentTypes,
            totalAmount,
            requestReferenceNumber,
          }
        );

        setMessage("Your Payment Cancellation was successful!");
        setProcessedData(response.data);
      } catch (error) {
        console.error(
          "Error updating lease agreement:",
          error.response?.data || error.message
        );
        const errorMessage =
          error.response?.data?.message ||
          "Failed to update payment status. Please contact support.";
        setMessage(errorMessage);
        setError(errorMessage);
        setProcessedData({
          requestReferenceNumber,
          itemTypesAttempted: paymentTypes,
          totalAmountAttempted: totalAmount,
        });
      } finally {
        setLoading(false);
      }
    }

    if (
      agreement_id &&
      payment_types &&
      totalAmount &&
      requestReferenceNumber
    ) {
      updateLeaseStatus();
    }
  }, [
    agreement_id,
    payment_types,
    totalAmount,
    requestReferenceNumber,
    status,
  ]);

  const formatItemName = (type) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="max-w-lg w-full mx-auto p-6 md:p-8 bg-white shadow-lg rounded-lg text-center">
        <h2
          className={`text-2xl md:text-3xl font-semibold mb-4 ${
            loading ? "text-gray-600" : error ? "text-red-600" : "text-red-600"
          }`}
        >
          {loading
            ? "Processing..."
            : error
            ? "Payment Recording Issue"
            : "Payment Cancelled"}
        </h2>

        <p className="text-gray-700 mb-6">{message}</p>

        {processedData && !loading && (
          <div
            className={`mt-4 p-4 border rounded ${
              error ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
            } text-left text-sm`}
          >
            <h3 className="text-md font-bold mb-2 text-gray-800">
              Payment Details {error ? "(Attempted)" : ""}
            </h3>
            <p className="mb-1">
              <strong>Reference:</strong>{" "}
              {processedData.requestReferenceNumber || "N/A"}
            </p>
            <p className="mb-1">
              <strong>Payment Types:</strong>{" "}
              {(
                processedData.confirmedItems ||
                processedData.itemTypesAttempted ||
                []
              )
                .map(formatItemName)
                .join(", ")}
            </p>
            <p>
              <strong>Total Amount:</strong> ₱
              {parseFloat(
                processedData.totalAmountConfirmed ||
                  processedData.totalAmountAttempted ||
                  0
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        )}

        <button
          onClick={() => router.push("/pages/tenant/my-unit")}
          className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? "Processing..." : "Return to My Unit"}
        </button>
      </div>
    </div>
  );
}
