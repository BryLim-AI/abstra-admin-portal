
import { db } from "../../../lib/db";
export default async function DeleteAccount(req, res) {
    try {
        console.log("Received request contents:", req.body);

        if (req.method !== "DELETE") {
            return res.status(405).json({ error: "Method Not Allowed. Use DELETE." });
        }

        const { user_id, userType } = req.body;

        if (!user_id || !userType) {
            return res.status(400).json({ error: "Missing user_id or userType" });
        }

        if (userType === "landlord") {
            console.log("Checking landlord details...");

            const [landlordRows] = await db.query(
                `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
                [user_id]
            );

            if (!landlordRows.length) {
                console.error("No landlord found for user_id:", user_id);
                return res.status(400).json({ error: "Landlord account not found." });
            }

            const landlordId = landlordRows[0].landlord_id;
            console.log("Landlord found:", landlordId);

            const [leaseRows] = await db.query(
                `SELECT COUNT(*) AS active_lease_count
                 FROM LeaseAgreement l
                 JOIN Unit u ON l.unit_id = u.unit_id
                 JOIN Property p ON u.property_id = p.property_id
                 WHERE p.landlord_id = ? AND l.status = 'active'`,
                [landlordId]
            );

            const activeLeaseCount = leaseRows[0]?.active_lease_count || 0;
            console.log("Active Lease Count:", activeLeaseCount);

            if (activeLeaseCount > 0) {
                console.error("Cannot deactivate account, active leases exist.");
                return res.status(400).json({ error: "You cannot deactivate your account. You have active leases." });
            }

            await db.query(`UPDATE Property SET status = 'inactive' WHERE landlord_id = ?`, [landlordId]);
            await db.query(
                `UPDATE Unit u 
                 JOIN Property p ON u.property_id = p.property_id
                 SET u.status = 'inactive' 
                 WHERE p.landlord_id = ?`,
                [landlordId]
            );

            await db.query(`UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?`, [landlordId]);


            console.log("Properties and units set to inactive.");
            await db.query(`UPDATE User SET status = 'deactivated', updatedAt = NOW() WHERE user_id = ?`, [user_id]);
            res.setHeader("Set-Cookie", "token=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict");
            return res.status(200).json({ message: "Your account has been deactivated." });


        }

        if (userType === "tenant") {
            console.log("Checking tenant details...");

            const [tenantRows] = await db.query(`SELECT tenant_id FROM Tenant WHERE user_id = ?`, [user_id]);

            if (!tenantRows.length) {
                return res.status(400).json({ error: "Tenant account not found." });
            }

            const tenantId = tenantRows[0].tenant_id;

            const [tenantLeaseRows] = await db.query(
                `SELECT COUNT(*) AS active_lease_count FROM LeaseAgreement WHERE tenant_id = ? AND status = 'active'`,
                [tenantId]
            );

            const activeTenantLeaseCount = tenantLeaseRows[0]?.active_lease_count || 0;
            console.log("Active Tenant Lease Count:", activeTenantLeaseCount);

            if (activeTenantLeaseCount > 0) {
                return res.status(400).json({ error: "You cannot deactivate your account. You have an active lease." });
            }

            console.log("Deactivating user account...");
            await db.query(`UPDATE User SET status = 'deactivated', updatedAt = NOW() WHERE user_id = ?`, [user_id]);
            res.setHeader("Set-Cookie", "token=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict");
            return res.status(200).json({ message: "Your account has been deactivated." });
        }


    } catch (error) {
        console.error("Error deactivating account:", error);
        return res.status(500).json({ error: "Failed to deactivate account." });
    }
}
