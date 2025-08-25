"use client";
import { useEffect, useState } from "react";

export default function LandlordSubscriptionCurrent({ user_id }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user_id) return;

    const fetchSubscriptions = async () => {
      try {
        const response = await fetch(
          `/api/subscription/by-user?user_id=${user_id}`
        );
        if (!response.ok) new Error("Failed to fetch subscription details.");
        const data = await response.json();
        setSubscriptions(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user_id]);

  if (loading)
    return (
      <div>
        <p>Loading subscription details...</p>
      </div>
    );
  if (error)
    return (
      <div>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );

  return (
    <div>
      <h3 style={{ marginTop: "20px" }}>Subscription History</h3>
      {subscriptions.length > 0 ? (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4", textAlign: "left" }}>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                Plan Name
              </th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                Status
              </th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                Start Date
              </th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                End Date
              </th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                Payment Status
              </th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                Amount Paid
              </th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor:
                    subscription.status === "active" ? "#e8f5e9" : "white",
                }}
              >
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {subscription.plan_name}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {subscription?.is_active === 1
                    ? "✅ Active"
                    : subscription?.is_active === 0
                    ? "❌ Expired"
                    : subscription.status === "pending"
                    ? "⏳ Pending"
                    : "❔ Unknown"}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {new Date(subscription.start_date).toLocaleDateString()}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {new Date(subscription.end_date).toLocaleDateString()}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {subscription.payment_status}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  ₱{subscription.amount_paid}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>
          <p>No subscription history available.</p>
        </div>
      )}
    </div>
  );
}
