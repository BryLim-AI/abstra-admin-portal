import { db } from "../../../../lib/db";


export default async function getSubscription(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ error: "Invalid request, missing landlord_id" });
    }

    try {
        const [rows] = await db.query(
            "SELECT plan_name, is_active, start_date, end_date, payment_status FROM Subscription WHERE landlord_id = ? AND is_active = 1",
            [landlord_id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        let subscription = rows[0];

        
        const listingLimits = {
            "Free Plan": { maxProperties: 1, maxUnits: 2, maxMaintenanceRequest: 5, maxReports: 3, maxBilling: 2, maxProspect: 3 },
            "Standard Plan": { maxProperties: 5, maxUnits: 2, maxMaintenanceRequest: 10, maxReports: 999999, maxBilling: 10, maxProspect: 10 },
            "Premium Plan": { maxProperties: 20, maxUnits: 50, maxMaintenanceRequest: 999999, maxReports: 999999, maxBilling: 999999, maxProspect: 999999 },
        };

        subscription.listingLimits = listingLimits[subscription.plan_name] || listingLimits["Free Plan"];

        return res.status(200).json(subscription);
    } catch (error) {
        console.error("Database query error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
    
}
