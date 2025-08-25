"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LandlordLayout from "../../../../../components/navigation/sidebar-landlord";

export default function TenantDetails() {
  const params = useParams();
  const tenant_id = params?.tenant_id;
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant_id) return;

    fetch(`/api/landlord/properties/getCurrentTenants/viewDetail/${tenant_id}`)
      .then((res) => res.json())
      .then((data) => {
        setTenant(data.tenant);
        setPaymentHistory(data.paymentHistory);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching tenant details:", error);
        setLoading(false);
      });
  }, [tenant_id]);

  if (loading) return <p>Loading tenant details...</p>;
  if (!tenant) return <p>Tenant not found.</p>;

  return (
    <LandlordLayout>
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-600 p-4 text-white">
            <h1 className="text-2xl font-bold flex items-center">
              <span>
                {tenant?.firstName} {tenant?.lastName}
              </span>
              <span className="ml-2 text-sm bg-blue-500 py-1 px-2 rounded-full">
                Tenant
              </span>
            </h1>
            <p className="text-blue-100">{tenant?.email}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Personal Information
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Occupation:</span>
                    <span className="font-medium">{tenant?.occupation}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Employment:</span>
                    <span className="font-medium">
                      {tenant?.employment_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Lease Information
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Property:</span>
                    <span className="font-medium">{tenant?.property_name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Start Date:</span>
                    <span className="font-medium">
                      {new Date(tenant?.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">End Date:</span>
                    <span className="font-medium">
                      {new Date(tenant?.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment History List */}
              <div className="mt-4">
                <h3 className="text-md font-semibold text-gray-700 border-b pb-2">
                  Transaction Records
                </h3>
                {paymentHistory.length === 0 ? (
                  <p className="text-gray-500">No payment records found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse mt-2 rounded-lg overflow-hidden shadow">
                      <thead>
                        <tr className="bg-gray-200 text-gray-700">
                          <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">Type</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment, index) => (
                          <tr
                            key={payment.payment_id}
                            className={`text-gray-600 ${
                              index % 2 === 0 ? "bg-gray-50" : "bg-white"
                            } hover:bg-gray-100 transition`}
                          >
                            <td className="p-3 text-left">
                              {new Date(
                                payment?.payment_date
                              ).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-left">
                              {payment?.payment_type}
                            </td>
                            <td className="p-3 text-right font-medium">
                              ₱
                              {isNaN(payment?.amount_paid)
                                ? "0.00"
                                : Number(payment.amount_paid).toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  payment?.payment_status === "confirmed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {payment?.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Tenants
              </button>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
