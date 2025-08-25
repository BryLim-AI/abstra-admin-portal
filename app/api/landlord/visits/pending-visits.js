import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { landlord_id } = req.query;

  if (!landlord_id) {
    return res.status(400).json({ message: "Missing landlord_id" });
  }

  try {
    const [requests] = await db.query(
      `SELECT 
    pv.visit_id,
    u.user_id,
    u.firstName AS encrypted_first_name,
    u.lastName AS encrypted_last_name,
    p.property_name,
    COALESCE(un.unit_name, 'N/A') AS unit_name,
    pv.visit_date,
    pv.visit_time,
    pv.status,
    pv.disapproval_reason
FROM PropertyVisit pv
JOIN Tenant t ON pv.tenant_id = t.tenant_id
JOIN User u ON t.user_id = u.user_id
JOIN Unit un ON pv.unit_id = un.unit_id
JOIN Property p ON un.property_id = p.property_id
WHERE p.landlord_id = ?
  AND pv.status = 'pending'
ORDER BY pv.visit_date ASC, pv.visit_time ASC;`,
      [landlord_id, landlord_id]
    );

    // Decrypt first and last names
    const decryptedRequests = requests.map((request) => {
      let tenantFirstName = "N/A";
      let tenantLastName = "N/A";

      try {
        if (request.encrypted_first_name) {
          tenantFirstName = decryptData(
            JSON.parse(request.encrypted_first_name),
            process.env.ENCRYPTION_SECRET
          );
        }
      } catch (err) {
        console.error(`Error decrypting first name for user ${request.user_id}:`, err);
      }

      try {
        if (request.encrypted_last_name) {
          tenantLastName = decryptData(
            JSON.parse(request.encrypted_last_name),
            process.env.ENCRYPTION_SECRET
          );
        }
      } catch (err) {
        console.error(`Error decrypting last name for user ${request.user_id}:`, err);
      }

      return {
        visit_id: request.visit_id,
        user_id: request.user_id,
        tenant_first_name: tenantFirstName,
        tenant_last_name: tenantLastName,
        property_name: request.property_name,
        unit_name: request.unit_name,
        visit_date: request.visit_date,
        visit_time: request.visit_time,
        status: request.status,
        disapproval_reason: request.disapproval_reason
      };
    });

    // Changed to match visit-all.js response format
    res.status(200).json(decryptedRequests);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error." });
  }
}