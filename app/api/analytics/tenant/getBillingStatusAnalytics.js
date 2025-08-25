import  {db} from "../../../../lib/db";


export default async function tenantBillingStatusPaid(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { tenant_id } = req.query;

    if (!tenant_id) {
        return res.status(400).json({ message: "Missing tenant_id parameter" });
    }

    try {
        const [billingStatus] = await db.execute(
            `SELECT DATE_FORMAT(b.billing_period, '%Y-%m') AS month, 
                    SUM(CASE WHEN b.status = 'paid' THEN b.total_amount_due ELSE 0 END) AS paid_amount,
                    SUM(CASE WHEN b.status = 'unpaid' THEN b.total_amount_due ELSE 0 END) AS unpaid_amount,
                    SUM(CASE WHEN b.status = 'overdue' THEN b.total_amount_due ELSE 0 END) AS overdue_amount
             FROM Billing b
             JOIN Unit u ON b.unit_id = u.unit_id
             JOIN LeaseAgreement la ON u.unit_id = la.unit_id
             WHERE la.tenant_id = ?
             GROUP BY month
             ORDER BY month;`,
            [tenant_id]
        );

        res.status(200).json(billingStatus);
    } catch (error) {
        console.error("Error fetching tenant billing status analytics:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}