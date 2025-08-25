import { db } from "../../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const { unit_id } = req.query;

        if (!unit_id) {
            return res.status(400).json({ message: "Unit ID is required" });
        }

        const [result] = await db.query(
            `
      SELECT 
        billing_id,
        billing_period,
        total_amount_due,
        status,
        due_date,
        created_at,
        paid_at
      FROM Billing
      WHERE unit_id = ?
      ORDER BY billing_period DESC
      `,
            [unit_id]
        );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: "Database Server Error" });
    }
}
