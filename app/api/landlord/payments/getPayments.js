import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  const { unit_id } = req.query;
  if (!unit_id) return res.status(400).json({ message: "Unit ID is required" });

  try {
    const [payments] = await db.query(
      `SELECT p.*, pm.method_name 
         FROM Payment p 
         LEFT JOIN PaymentMethod pm ON p.payment_method_id = pm.method_id 
         WHERE p.agreement_id IN (SELECT agreement_id FROM LeaseAgreement WHERE unit_id = ?)`,
      [unit_id]
    );

    console.log("Payments:", payments);

    const decryptedPayments = payments.map((payment) => ({
      ...payment,
      proof_of_payment: payment.proof_of_payment
        ? decryptData(
            JSON.parse(payment.proof_of_payment),
            process.env.ENCRYPTION_SECRET
          )
        : null,
    }));

    res.status(200).json(decryptedPayments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payments" });
  }
}
