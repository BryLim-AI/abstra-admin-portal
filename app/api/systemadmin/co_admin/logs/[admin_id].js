import { db } from "../../../../../lib/db";

export default async function viewAdminLogActivity(req, res) {
    const { admin_id } = req.query;

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed, ONLY fetching of record is allowed." });
    }

    try {
        const [logs] = await db.query(
            "SELECT log_id, action, timestamp FROM ActivityLog WHERE admin_id = ? ORDER BY timestamp DESC",
            [admin_id]
        );

        if (logs.length === 0) {
            return res.status(404).json({ success: false, message: "No logs found for this admin." });
        }

        return res.status(200).json({ success: true, logs: logs || [] });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
