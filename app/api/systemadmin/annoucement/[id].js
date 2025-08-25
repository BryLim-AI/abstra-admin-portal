import { db } from "../../../../lib/db";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

export default async function deleteAnnoucement(req, res) {

    try{
        const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
        if (!cookies || !cookies.token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const secretKey = process.env.JWT_SECRET;
        const decoded = jwt.verify(cookies.token, secretKey);
        if (!decoded || !decoded.admin_id) {
            return res.status(401).json({ success: false, message: "Invalid Token" });
        }

        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: "Co-admin ID is required" });
        }

        if (req.method === "DELETE") {
            const [result] = await db.query("DELETE FROM AdminAnnouncement WHERE id = ?", [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Announcement not found" });
            }
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
                [decoded.admin_id, `Deleted Annoucement ID: ${id}`]
            );
            return res.status(200).json({ success: true, message: "Annoucement deleted successfully" });

        }
    }catch (error) {
        console.log("Error:", error);

    }

}