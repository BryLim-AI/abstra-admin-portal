// Finds the agreement_id linked to tenant_id .
// Checks if the payment is already recorded (prevents duplicates).

import mysql from "mysql2/promise";
import { decryptData } from "../../../crypto/encrypt";

export default async function billingSuccessPayment(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { tenant_id, requestReferenceNumber, amount, billing_id } = req.body;

    if (!tenant_id || !requestReferenceNumber || !amount) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;

    let connection;

    try {
      connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: dbName,
      });

      //  Fetch  Active Lease Agreement of the Tenant
      const [activeLease] = await connection.execute(
        `SELECT agreement_id, unit_id FROM LeaseAgreement 
                 WHERE tenant_id = ? AND status = 'active' 
                 LIMIT 1`,
        [tenant_id]
      );

      if (activeLease.length === 0) {
        await connection.end();
        return res
          .status(404)
          .json({ message: "No active lease found for this tenant." });
      }

      const { agreement_id, unit_id } = activeLease[0];

      // Checking If Payment is Already Recorded
      const [existingPayment] = await connection.execute(
        `SELECT * FROM Payment WHERE receipt_reference = ? LIMIT 1`,
        [requestReferenceNumber]
      );

      if (existingPayment.length > 0) {
        await connection.end();
        return res.status(400).json({ message: "Payment already recorded." });
      }

      // Insert Payment Record
      await connection.execute(
        `INSERT INTO Payment (agreement_id, payment_type, amount_paid, payment_method_id, payment_status, receipt_reference, created_at)
                 VALUES (?, ?, ?, ?, 'confirmed', ?, NOW())`,
        [agreement_id, "billing", amount, 1, requestReferenceNumber]
      );

      await connection.execute(
        `UPDATE Billing 
                 SET status = 'paid', paid_at = NOW(), updated_at = NOW() 
                 WHERE billing_id = ?`,
        [billing_id]
      );

      const [tenantDetails] = await connection.execute(
        `SELECT u.firstName, u.lastName
           FROM Tenant t
           JOIN User u ON t.user_id = u.user_id
           WHERE t.tenant_id = ?`,
        [tenant_id]
      );

      if (tenantDetails.length === 0) {
        await connection.end();
        return res.status(404).json({ message: "Tenant not found." });
      }

      const { firstName, lastName } = tenantDetails[0];

      const decryptedFirstName = decryptData(
        JSON.parse(firstName),
        process.env.ENCRYPTION_SECRET
      );
      const decryptedLastName = decryptData(
        JSON.parse(lastName),
        process.env.ENCRYPTION_SECRET
      );

      const [unitDetails] = await connection.execute(
        `SELECT p.landlord_id, u.unit_name
           FROM Unit u
           JOIN Property p ON u.property_id = p.property_id
           WHERE u.unit_id = ?`,
        [unit_id]
      );

      if (unitDetails.length > 0) {
        const landlord_id = unitDetails[0].landlord_id;
        const unit_name = unitDetails[0].unit_name;

        const [landlordDetails] = await connection.execute(
          `SELECT user_id FROM Landlord WHERE landlord_id = ?`,
          [landlord_id]
        );

        if (landlordDetails.length > 0) {
          const landlord_user_id = landlordDetails[0].user_id;

          await connection.execute(
            `INSERT INTO Notification (user_id, title, body, is_read, created_at)
                             VALUES (?, ?, ?, ?, NOW())`,
            [
              landlord_user_id,
              "Tenant Payment Received",
              `The tenant ${decryptedFirstName} ${decryptedLastName} has successfully paid their bill for the unit ${unit_name}.`,
              0,
            ]
          );
          console.log(
            `Notified landlord about payment from tenant ${decryptedFirstName} ${decryptedLastName}`
          );
        }
      }

      await connection.end();

      return res.status(200).json({
        message: `Payment for Monthly Billing recorded successfully.`,
        tenant_id,
        agreement_id,
        requestReferenceNumber,
      });
    } catch (dbError) {
      if (connection) await connection.end();
      return res
        .status(500)
        .json({ message: "Database Error", error: dbError.message });
    }
  } catch (error) {
    console.error("Error processing payment success:", error);
  }
}
