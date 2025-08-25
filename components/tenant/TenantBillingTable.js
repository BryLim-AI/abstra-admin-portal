import { useEffect, useState } from "react";
import axios from "axios";

export default function TenantBillingTable({ tenant_id }) {
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBillingInfo() {
      try {
        const response = await axios.get(
          `/api/tenant/dashboard/getTenantBilling?tenant_id=${tenant_id}`
        );
        setBillingData(response.data[0]);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch billing data."
        );
      } finally {
        setLoading(false);
      }
    }

    if (tenant_id) {
      fetchBillingInfo();
    }
  }, [tenant_id]);

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full flex items-center justify-center">
        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 font-medium">Loading billing details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Billing Information</h2>
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Billing Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!billingData || billingData.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Billing Information</h2>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Billing Records Found</h3>
          <p className="text-gray-500 mb-6">There are currently no billing records available for your account.</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Your billing information will appear here once available.</p>
            <p className="text-sm text-gray-600">If you believe this is an error, please contact support.</p>
          </div>
          <button 
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Billing Information</h2>
      <div className="overflow-x-auto mt-4">
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border px-6 py-3 text-left">Total Amount Due</th>
              <th className="border px-6 py-3 text-left">Status</th>
              <th className="border px-6 py-3 text-left">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {billingData.map((bill, index) => {
              const amount = parseFloat(bill?.total_amount_due) || 0;
              return (
                <tr
                  key={index}
                  className="text-gray-600 even:bg-gray-50 hover:bg-gray-100 transition"
                >
                  <td className="border px-6 py-3">₱{amount.toFixed(2)}</td>
                  <td
                    className={`border px-6 py-3 font-bold ${
                      bill?.status === "paid"
                        ? "text-green-600"
                        : bill?.status === "overdue"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {bill?.status?.toUpperCase() || "UNKNOWN"}
                  </td>
                  <td className="border px-6 py-3">
                    {bill?.due_date
                      ? new Date(bill.due_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
  
}
