import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { payment_id, payment_status, payment_type } = req.body;

  if (!payment_id || !payment_status || !payment_type) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    
    await db.query(
      `UPDATE Payment SET payment_status = ?, payment_type = ?, updated_at = NOW() WHERE payment_id = ?`,
      [payment_status, payment_type, payment_id]
    );

    
    if (payment_status === "confirmed") {
      const [payment] = await db.query(
        `SELECT agreement_id FROM Payment WHERE payment_id = ?`,
        [payment_id]
      );

      if (payment.length > 0) {
        const agreementId = payment[0].agreement_id;

        let updateField = "";
        if (payment_type === "security_deposit") {
          updateField = "is_security_deposit_paid";
        } else if (payment_type === "advance_rent") {
          updateField = "is_advance_payment_paid";
        }

        if (updateField) {
          await db.query(
            `UPDATE LeaseAgreement SET ${updateField} = 1, updated_at = NOW() WHERE agreement_id = ?`,
            [agreementId]
          );
        }
      }
    }

    res.status(200).json({ message: "Payment updated successfully" });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Error updating payment" });
  }
}
