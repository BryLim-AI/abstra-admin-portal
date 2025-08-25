import { db } from "../../../lib/db";

export default async function deleteAdminAccount(req, res) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const { admin_id } = req.body;

        if (!admin_id) {
            return res.status(400).json({ message: "Admin ID is required." });
        }

        // Delete the admin from the database
        const [result] = await db.query("DELETE FROM Admin WHERE admin_id = ?", [admin_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Admin not found or already deleted." });
        }

        return res.status(200).json({ message: "Admin account successfully deleted." });
    } catch (error) {
        console.error("Error deleting admin account:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
