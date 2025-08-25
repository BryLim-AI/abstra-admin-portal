"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function TenantLeasePayments({ agreement_id }) {
  const [payments, setPayments] = useState([]);
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const fetchPayments = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await axios.get(
          `/api/tenant/payment/currentPaymentHistory?agreement_id=${agreement_id}`
        );

        console.log(res.data);
        if (res.status === 200) {
          setLease(res.data.leaseAgreement || null);
          setPayments(res.data.payments || []);
        } else {
          setError(`Unexpected response: ${res.status}`);
        }
      } catch (err) {
        setError(
          `Failed to fetch payments. ${
            err.response?.data?.error || err.message
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Status components with improved UI
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600 font-medium">Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded shadow-md">
        <div className="flex items-center">
          <svg
            className="h-6 w-6 text-gray-600 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-700 font-medium">
            No bills found. Please check back later.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-medium transition duration-300"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-md">
        <div className="flex items-center">
          <svg
            className="h-6 w-6 text-yellow-500 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-yellow-700 font-medium">
            No active lease found for this tenant.
          </p>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-md">
        <div className="flex items-center">
          <svg
            className="h-6 w-6 text-blue-500 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-blue-700 font-medium">
              No payment records found for the active lease.
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Lease ID: {lease.agreement_id}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Format currency with commas
  const formatCurrency = (amount) => {
    return amount
      ? amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : "0";
  };

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gray-50 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
      </h1>

      <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-700">
        Payment History
      </h2>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.payment_id}
            className="p-5 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 capitalize">
                  {payment.payment_type.replace("_", " ")}
                </h3>
                <p className="text-gray-500 text-sm">
                  {formatDate(payment?.payment_date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">
                  ₱{formatCurrency(payment?.amount_paid)}
                </p>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    payment?.payment_status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {payment.payment_status}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                <div>
                  <span className="text-gray-500 text-sm">Payment Method:</span>
                  <span className="ml-2 font-medium">
                    {payment?.payment_method || "N/A"}
                  </span>
                </div>
                {payment.receipt_reference && (
                  <div>
                    <span className="text-gray-500 text-sm">
                      Receipt Reference:
                    </span>
                    <span className="ml-2 font-medium">
                      {payment?.receipt_reference}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
