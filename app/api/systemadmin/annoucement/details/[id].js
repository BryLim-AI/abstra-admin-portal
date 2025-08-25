import { db } from "../../../../../lib/db";

export default async function getAnnoucementDetails(req, res) {
    const { id } = req.query;

    if (req.method === "GET") {
        try {
            const [announcements] = await db.query(
                "SELECT id, title, message, target_audience FROM AdminAnnouncement WHERE id = ?",
                [id]
            );

            if (announcements.length === 0) {
                return res.status(404).json({ success: false, message: "Announcement not found" });
            }
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
                [req.admin_id, `Viewed announcement: ${announcements[0].title}`]
            );
            return res.status(200).json({ success: true, announcement: announcements[0] });
        } catch (error) {
            console.error("Error fetching announcement details:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    if (req.method === "PATCH") {
        const { title, message, target_audience } = req.body;

        try {
            if (!title && !message && !target_audience) {
                return res.status(400).json({ success: false, message: "No updates provided" });
            }

            let query = "UPDATE AdminAnnouncement SET";
            let params = [];
            let updates = [];

            if (title) {
                updates.push(" title = ?");
                params.push(title);
            }
            if (message) {
                updates.push(" message = ?");
                params.push(message);
            }
            if (target_audience) {
                updates.push(" target_audience = ?");
                params.push(target_audience);
            }

            query += updates.join(", ") + " WHERE id = ?";
            params.push(id);

            const [updateResult] = await db.query(query, params);

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Announcement not found" });
            }

            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
                [req.admin_id, `Updated announcement"}`]
            );

            return res.status(200).json({ success: true, message: "Announcement updated successfully" });
        } catch (error) {
            console.error("Error updating Announcement:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
