"use client";
import { useEffect, useState } from "react";

const PaymentList = ({ landlord_id }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!landlord_id) return;

    const fetchPayments = async () => {
      try {
        const response = await fetch(
          `/api/landlord/payments/getPaymentList?landlord_id=${landlord_id}`
        );
        const data = await response.json();

        if (response.ok) {
          setPayments(data);
        } else {
          new Error(data.error || "Failed to fetch payments");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [landlord_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 text-lg animate-pulse">
          Loading payments...
        </div>
      </div>
    );
  }

  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white p-6 shadow-lg rounded-xl">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
        Payments Received
      </h2>

      {payments.length === 0 ? (
        <p className="text-gray-600">No payments found.</p>
      ) : (
        <div className="overflow-x-auto">
          {/* Table for medium and larger screens */}
          <table className="hidden md:table w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-md text-gray-700">
                <th className="p-3 font-semibold">Payment ID</th>
                <th className="p-3 font-semibold">Property</th>
                <th className="p-3 font-semibold">Unit</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Receipt Ref</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.payment_id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3">{payment.payment_id}</td>
                  <td className="p-3">{payment.property_name}</td>
                  <td className="p-3">{payment.unit_name}</td>
                  <td className="p-3">{payment.payment_type}</td>
                  <td className="p-3">
                    ₱{Number(payment.amount_paid || 0).toFixed(2)}
                  </td>
                  <td
                    className={`p-3 font-medium ${
                      payment.payment_status === "confirmed"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {payment.payment_status}
                  </td>
                  <td className="p-3">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="p-3">{payment.receipt_reference || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Card view for small screens */}
          <div className="md:hidden space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.payment_id}
                className="border rounded-lg p-4 shadow-sm bg-gray-50"
              >
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-700">
                    Payment ID:
                  </span>
                  <span>{payment.payment_id}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Property:</span>
                  <span>{payment.property_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Unit:</span>
                  <span>{payment.unit_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Type:</span>
                  <span>{payment.payment_type}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Amount:</span>
                  <span>₱{Number(payment.amount_paid || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-semibold ${
                      payment.payment_status === "confirmed"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {payment.payment_status}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Date:</span>
                  <span>
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt Ref:</span>
                  <span>{payment.receipt_reference || "N/A"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentList;
