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

    // Get the unit_id for the tenant's active lease
    const [lease] = await db.query(
      "SELECT unit_id FROM LeaseAgreement WHERE tenant_id = ? AND status = 'active' LIMIT 1",
      [tenant_id]
    );

    if (!lease || lease.length === 0) {
      console.log("No active lease found for tenant:", tenant_id);
      return res
        .status(404)
        .json({ message: "No active lease found for you." });
    }

    const { unit_id } = lease[0]; // Fixing destructuring

    console.log("Found unit_id:", unit_id);

    // Fetch the billing information for the unit
    const billingRecords = await db.query(
      "SELECT total_amount_due, status, due_date FROM Billing WHERE unit_id = ? ORDER BY due_date DESC",
      [unit_id]
    );

    console.log(billingRecords);

    res.status(200).json(billingRecords);
  } catch (error) {
    console.error("Error fetching tenant billing info:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
