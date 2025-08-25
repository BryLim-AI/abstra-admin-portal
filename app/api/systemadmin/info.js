import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";


export default async function getCurrentAdminInfo(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        // Parse cookies
        const cookies = parse(req.headers.cookie || "");
        const token = cookies.token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized: Token missing" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [admins] = await db.execute(
            "SELECT username, role FROM Admin WHERE admin_id = ?",
            [decoded.admin_id]
        );

        if (admins.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }

        const admin = admins[0];

        // Return admin info
        res.status(200).json({
            username: admin.username,
            role: admin.role,
        });
    } catch (error) {
        console.error("Error fetching admin info:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}