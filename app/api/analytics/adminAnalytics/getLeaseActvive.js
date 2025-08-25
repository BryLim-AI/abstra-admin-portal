import  {db} from "../../../../lib/db";

export default async function leaseAgreementsAnalytics(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const [totalLeases] = await db.execute(`SELECT COUNT(*) AS total_leases FROM LeaseAgreement;`);

        const [leaseStatus] = await db.execute(
            `SELECT status, COUNT(*) AS lease_count FROM LeaseAgreement GROUP BY status;`
        );

        const [leaseExpirations] = await db.execute(
            `SELECT DATE_FORMAT(end_date, '%Y-%m') AS month, COUNT(*) AS expiring_leases
             FROM LeaseAgreement WHERE status = 'active'
             GROUP BY month ORDER BY month;`
        );

        const [leaseByProperty] = await db.execute(
            `SELECT u.property_id, COUNT(*) AS lease_count
             FROM LeaseAgreement la JOIN Unit u ON la.unit_id = u.unit_id
             GROUP BY u.property_id ORDER BY lease_count DESC;`
        );

        const [averageLeaseDuration] = await db.execute(
            `SELECT AVG(TIMESTAMPDIFF(MONTH, start_date, end_date)) AS avg_lease_duration FROM LeaseAgreement;`
        );

        res.status(200).json({
            total_leases: totalLeases[0].total_leases,
            lease_status: leaseStatus,
            lease_expirations: leaseExpirations,
            lease_by_property: leaseByProperty,
            avg_lease_duration: averageLeaseDuration[0].avg_lease_duration,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}