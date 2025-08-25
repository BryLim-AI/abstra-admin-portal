import { db } from "../../../lib/db";


export default async function handler(req, res) {
    if (req.method === "GET") {
        try {
            const { userId } = req.query;

            const [rows] = await db.query(
                "SELECT fcm_token FROM User WHERE user_id = ?",
                [userId]
            );

            if (rows.length > 0) {
                return res.status(200).json({ enabled: rows[0].fcm_token !== null, fcmToken: rows[0].fcm_token });
            } else {
                return res.status(404).json({ error: "User not found" });
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return res.status(500).json({ error: "Database error" });
        }
    }

    if (req.method === "POST") {
        try {
            const { userId, token } = req.body;

            await db.query(
                "UPDATE User SET fcm_token = ? WHERE user_id = ?",
                [token || null, userId]
            );

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error updating notifications:", error);
            return res.status(500).json({ error: "Database error" });
        }
    }

    res.status(405).json({ error: "Method not allowed" });
}
