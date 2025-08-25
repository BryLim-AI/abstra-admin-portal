import  {db} from "../../../../lib/db";

export default async function getCurrentUsageOfTenants(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { tenant_id } = req.query;

    if (!tenant_id) {
        return res.status(400).json({ message: "Missing tenant_id parameter" });
    }

    try {
        const [meterUsage] = await db.execute(
            `SELECT DATE_FORMAT(mr.reading_date, '%Y-%m') AS month, 
                    mr.utility_type,
                    SUM(mr.current_reading - mr.previous_reading) AS total_usage
             FROM MeterReading mr
             JOIN Unit u ON mr.unit_id = u.unit_id
             JOIN LeaseAgreement la ON u.unit_id = la.unit_id
             WHERE la.tenant_id = ? AND la.status = 'active'
             GROUP BY month, mr.utility_type
             ORDER BY month;`,
            [tenant_id]
        );

        res.status(200).json(meterUsage);
    } catch (error) {
        console.error("Error fetching tenant meter usage:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}