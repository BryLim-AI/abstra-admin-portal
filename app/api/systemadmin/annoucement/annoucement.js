    import { db } from "../../../../lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import {logAuditEvent} from "../../../../utils/auditLogger";

export default async function addNewAnnouncement(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed, only CREATION of records is allowed." });
    }

    try {

        //region GET CURRENT LOGGED IN ADMIN ID
        const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
        if (!cookies || !cookies.token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        let decoded;
        try {
            const { payload } = await jwtVerify(cookies.token, secretKey);
            decoded = payload;
        } catch (err) {
            console.log("Error:", err);
        }

        if (!decoded || !decoded.admin_id) {
            return res.status(401).json({ success: false, message: "Invalid Token Data" });
        }

        //endregion

        const { title, message, target_audience } = req.body;
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (!title || !message || !target_audience) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const [result] = await db.query(
            "INSERT INTO AdminAnnouncement (admin_id, title, message, target_audience) VALUES (?, ?, ?, ?)",
            [decoded.admin_id, title, message, target_audience]
        );

        await db.query(
            "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
            [decoded.admin_id, `Created an announcement: ${title}`]
        );

        let query = '';

        if (target_audience === "all") {
            query = "SELECT user_id FROM User";
        } else if (target_audience === "tenant") {
            query = "SELECT user_id FROM User WHERE userType = 'tenant'";
        } else if (target_audience === "landlord") {
            query = "SELECT user_id FROM User WHERE userType = 'landlord'";
        }

        const [users] = await db.query(query);
        if (users.length > 0) {
            const notificationValues = users.map(user => `('${user.user_id}', '${title}', '${message}', 0, NOW())`).join(",");
            await db.query(`INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES ${notificationValues}`);
        }


        await logAuditEvent(
            decoded.admin_id,
            "Created Announcement",
            "AdminAnnouncement",
            result.insertId,
            ipAddress,
            "Success",
            `Admin created an announcement titled "${title}"`
        );
        return res.status(201).json({ success: true, message: "Announcement created successfully!" });

    } catch (error) {
        console.error("Error creating announcement:", error);
        await logAuditEvent(
            req.admin_id,
            "Failed to Create Announcement",
            "AdminAnnouncement",
            null,
            req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            "Failure",
            `Error: ${error.message}`
        );
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
