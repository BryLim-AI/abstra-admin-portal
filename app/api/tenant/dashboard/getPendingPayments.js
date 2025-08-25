import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { tenant_id } = req.query;

    if (!tenant_id) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Fetch total pending payments from Billing
    const [result] = await db.query(
        `
          SELECT COALESCE(SUM(Billing.total_amount_due), 0) AS total_pending
          FROM Billing
                 JOIN Unit ON Billing.unit_id = Unit.unit_id
                 JOIN LeaseAgreement ON Unit.unit_id = LeaseAgreement.unit_id
          WHERE LeaseAgreement.tenant_id = ?
            AND Billing.status IN ('unpaid', 'overdue')
        `,
        [tenant_id]
    );

    return res.status(200).json({ total_pending: result[0]?.total_pending || 0 });
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}