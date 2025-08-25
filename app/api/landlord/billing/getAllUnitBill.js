import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { unit_id } = req.query;

  if (!unit_id) {
    return res.status(400).json({ message: "Unit ID is required" });
  }

  try {
    const [billingRecords] = await db.query(
      `SELECT 
                b.billing_id, 
                b.billing_period, 
                b.total_water_amount, 
                b.total_electricity_amount, 
                b.penalty_amount, 
                b.discount_amount, 
                b.total_amount_due, 
                b.status, 
                b.due_date, 
                b.paid_at 
            FROM Billing b 
            WHERE b.unit_id = ? 
            ORDER BY b.billing_period DESC`,
      [unit_id]
    );

    res.status(200).json(billingRecords);
  } catch (error) {
    console.error("Error fetching unit billing:", error);
  }
}
