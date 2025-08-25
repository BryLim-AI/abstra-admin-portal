"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function TenantBilling({ agreement_id, user_id }) {
  const [billingData, setBillingData] = useState([]);
  const [meterReadings, setMeterReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const router = useRouter();

useEffect(() => {
  if (!user_id) {
    return;
  }

  const fetchBillingData = async () => {
    try {
      const res = await axios.get(`/api/tenant/billing/viewCurrentBilling`, {
        params: { agreement_id, user_id },
      });

      const billings = res.data.billing ? [res.data.billing] : [];

      const rawMeterReadings = res.data.meterReadings || {};
      const flatReadings = [
        ...(rawMeterReadings.water || []),
        ...(rawMeterReadings.electricity || []),
      ];
// The spread syntax ... is used to extract the elements of each array into a single new array.
      setBillingData(billings);
      setMeterReadings(flatReadings);
    } catch (err) {
      setError("Failed to fetch billing data.");
    } finally {
      setLoading(false);
    }
  };

  fetchBillingData();
}, [agreement_id, user_id]);


  const handleMayaPayment = async (amount, billing_id) => {
    const result = await Swal.fire({
      title: "Billing Payment via Maya",
      text: `Are you sure you want to pay your current billing through Maya?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Pay with Maya",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setLoadingPayment(true);
      try {
        const res = await axios.post("/api/tenant/billing/payment", {
          amount,
          billing_id,
          tenant_id: user_id,
          payment_method_id: 1,
          redirectUrl: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billSuccess`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billFailed`,
            cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billCancelled`,
          },
        });

        if (res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        }
      } catch (error) {
        console.error("Payment error:", error);
        await Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "Failed to process payment. Please try again.",
        });
      } finally {
        setLoadingPayment(false);
      }
    }
  };

  const handlePaymentOptions = (billing_id, amount) => {
    if (!agreement_id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not find your agreement details. Please try again later.",
      });
      return;
    }

    router.push(
      `/pages/payment/proofOfPayment?agreement_id=${agreement_id}&amountPaid=${amount}&billingId=${billing_id}`
    );
  };

  if (loading) return <p className="text-gray-500">Loading billing records...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

if (!Array.isArray(billingData) || billingData.length === 0) {
  return (
    <div className="text-gray-500 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
      No billing records found.
    </div>
  );
}

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Your Current Billing
        </h1>
        <span className="hidden sm:inline-flex items-center px-3 py-1 mt-2 sm:mt-0 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {billingData.length} {billingData.length === 1 ? "bill" : "bills"}
        </span>
      </div>

      <div className="space-y-6">
        {billingData.map((bill) => (
          <div key={bill.billing_id} className="bg-white shadow rounded-xl border">
            <div className="px-6 py-5 border-b">
              <div className="flex flex-wrap items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{bill.unit_name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{bill.billing_period}</p>
                </div>
                <div className="flex items-center mt-2 sm:mt-0">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    bill.status === "unpaid"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {bill.status}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">ID: {bill.billing_id}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500">Amount Due</span>
                  <span className="mt-1 text-2xl font-bold text-gray-900">
                    ₱{parseFloat(bill.total_amount_due).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500">Due Date</span>
                  <span className="mt-1 font-medium text-gray-900">{bill.due_date}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500">Payment Status</span>
                  {bill.paid_at ? (
                    <span className="mt-1 font-medium text-green-600 flex items-center">
                      ✅ Paid on {bill.paid_at}
                    </span>
                  ) : (
                    <span className="mt-1 font-medium text-red-600 flex items-center">
                      ❌ Not yet paid
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
                  Meter Readings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.isArray(meterReadings)
  ? meterReadings
      .filter((r) => r.unit_id === bill.unit_id)
      .map((r, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {r.utility_type?.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{r.reading_date}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Previous</p>
              <p className="text-sm font-medium">{r.previous_reading}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current</p>
              <p className="text-sm font-medium">{r.current_reading}</p>
            </div>
          </div>
        </div>
      ))
  : <p className="text-sm text-gray-500 italic">No meter readings available.</p>
}

                </div>
              </div>

              {bill.status === "unpaid" && (
                <div className="pt-4 border-t">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleMayaPayment(bill.total_amount_due, bill.billing_id)}
                      disabled={loadingPayment}
                      className={`px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm text-white ${
                        loadingPayment ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {loadingPayment ? "Processing..." : "Pay Now via Maya"}
                    </button>
                    <button
                      onClick={() => handlePaymentOptions(bill.billing_id, bill.total_amount_due)}
                      className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      Other Payment Options
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
