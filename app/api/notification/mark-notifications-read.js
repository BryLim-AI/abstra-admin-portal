import { db } from "../../../lib/db";

export default async function markNotificationsAsRead(req, res) {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        await db.execute("UPDATE Notification SET is_read = 1 WHERE user_id = ?", [user_id]);

        return res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}