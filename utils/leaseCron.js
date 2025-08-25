import { db } from "../lib/db";
import { decryptData } from "../crypto/encrypt";

export const checkExpiringLeases = async () => {
  try {
    const [expiringLeases] = await db.execute(`
      SELECT 
        la.agreement_id,
        la.end_date,
        la.unit_id,
        la.tenant_id,
        u.user_id AS tenant_user_id,
        l.user_id AS landlord_user_id,
        p.property_name,
        u2.firstName AS tenant_name
      FROM LeaseAgreement la
      JOIN Unit un ON la.unit_id = un.unit_id
      JOIN Property p ON un.property_id = p.property_id
      JOIN Landlord l ON p.landlord_id = l.landlord_id
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      JOIN User u2 ON l.user_id = u2.user_id
      WHERE la.status = 'active'
      AND la.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);

    for (const lease of expiringLeases) {
      const decryptedTenantName = decryptData(
        JSON.parse(lease.tenant_name),
        process.env.ENCRYPTION_SECRET
      );

      const formattedDate = new Date(lease.end_date).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      await db.execute(
        `
          INSERT INTO Notification (user_id, title, body, is_read, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `,
        [
          lease.landlord_user_id,
          "Lease Expiring Soon",
          `The lease for tenant ${decryptedTenantName} at ${lease.property_name} is expiring on ${formattedDate}.`,
          0,
        ]
      );

      console.log(`Notified landlord of lease ending on ${lease.end_date}`);
    }

    console.log("Lease expiration check complete.");
  } catch (error) {
    console.error("Error checking lease expirations:", error);
  }
};
