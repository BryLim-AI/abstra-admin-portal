import { db } from "../../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { landlord_id } = req.query;
    if (!landlord_id) {
        return res.status(400).json({ message: "Missing landlord_id parameter." });
    }

    try {
        const [subscription] = await db.query(`
            SELECT * FROM Subscription
            WHERE landlord_id = ? AND status IN ('active', 'pending')
            ORDER BY start_date DESC LIMIT 1
        `, [landlord_id]);

        if (!subscription) {
            return res.status(404).json({ message: "No active subscription found." });
        }

        res.status(200).json(subscription);
    } catch (error) {
        console.error("Error fetching subscription:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}