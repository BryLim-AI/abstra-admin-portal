import { useEffect, useState } from "react";

export default function PropertyListUser({ user_id }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user_id) return;

    const fetchProperties = async () => {
      try {
        const response = await fetch(
          `/api/properties/by-user?user_id=${user_id}`
        );
        if (!response.ok) throw new Error("Failed to fetch properties.");
        const data = await response.json();

        setProperties(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user_id]);

  if (loading)
    return (
      <div>
        <p>Loading properties...</p>
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
      <h3 style={{ marginTop: "20px" }}>Property Listings</h3>
      {properties.length > 0 ? (
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
                Property Name
              </th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                Type
              </th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                Location
              </th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                Rent Payment
              </th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr
                key={property.property_id}
                style={{
                  backgroundColor:
                    property.status === "occupied" ? "#ffebee" : "#e8f5e9",
                }}
              >
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {property.property_name}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {property.property_type}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {property.street ? `${property.street}, ` : ""}
                  {property.city}, {property.province}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  ₱{property.rent_payment || "N/A"}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {property.status === "occupied"
                    ? "❌ Occupied"
                    : "✅ Available"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>
          <p>No properties listed.</p>
        </div>
      )}
    </div>
  );
}
