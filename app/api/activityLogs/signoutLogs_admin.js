import { db } from "../../../lib/db";

export default async function adminLogOutActLogs(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed, ONLY creaetion of logs is allowed." });
    }

    const { admin_id, action, timestamp } = req.body;

    if (!admin_id || !action || !timestamp) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        await db.query(
            `INSERT INTO ActivityLog (admin_id, action, timestamp)
       VALUES (?, ?, ?)`,
            [admin_id, action, timestamp]
        );
        return res.status(200).json({ message: "Signout log recorded successfully" });
    } catch (error) {
        console.error("Error logging admin signout activity:", error);
    }
}
