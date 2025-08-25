import { db } from "../../../lib/db";

export default async function getNotificationsInApp(req, res) {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const [notifications] = await db.execute(
            "SELECT id, title, body, created_at FROM Notification WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC",
            [user_id]
        );

        return res.status(200).json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}