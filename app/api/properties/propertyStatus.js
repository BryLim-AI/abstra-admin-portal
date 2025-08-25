import mysql from "mysql2/promise";
import { parse } from "cookie";
import { jwtVerify } from "jose";
//  to be deleted.
export default async function handler(req, res) {

//region GET ADMIN ID

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
        return res.status(401).json({ success: false, message: err });
    }

    if (!decoded || !decoded.admin_id) {
        return res.status(401).json({ success: false, message: "Invalid Token Data" });
    }

    const currentadmin_id = decoded.admin_id;

//endregion

    const { property_id, status, message } = req.body;

    if (!property_id || !status) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await connection.execute(
            `SELECT pv.status, pv.attempts, l.user_id
             FROM PropertyVerification pv
                      JOIN Property p ON pv.property_id = p.property_id
                      JOIN Landlord l ON p.landlord_id = l.landlord_id
                      JOIN User u ON l.user_id = u.user_id
             WHERE pv.property_id = ?`,
            [property_id]
        );

        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ message: "Property not found" });
        }

        const { status: currentStatus, attempts, user_id } = rows[0];

        if (!user_id) {
            await connection.end();
            return res.status(500).json({ message: "Landlord not found for this property." });
        }

        // Prevent further submissions after two rejections
        if (currentStatus === "Rejected" && attempts >= 2) {

            const notificationTitle = `Property ${status} `;
            const notificationBody = `Your property listing has been  ${status.toLowerCase()} twice, you cannot resend documents again. ${
                message ? `Message: ${message}` : ""
            }`;

            await connection.execute(
                `INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())`,
                [user_id, notificationTitle, notificationBody]
            );

        }

        let newAttempts = attempts;
        if (status === "Rejected") {
            newAttempts = attempts + 1;
        }

        // Update the property verification status
        const [result] = await connection.execute(
            `UPDATE PropertyVerification
             SET status = ?, admin_message = ?, reviewed_by = ?, attempts = ?
             WHERE property_id = ?`,
            [status, message || null, currentadmin_id, newAttempts, property_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Property not found" });
        }

        const notificationTitle = `Property ${status}`;
        const notificationBody = `Your property listing has been ${status.toLowerCase()}. ${
            message ? `Message: ${message}` : ""
        }`;

        await connection.execute(
            `INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())`,
            [user_id, notificationTitle, notificationBody]
        );

        await connection.end();

        return res.status(200).json({
            message: `Property ${status.toLowerCase()} reviewed by Admin ${currentadmin_id}.`,
            attempts: newAttempts
        });

    } catch (error) {
        console.error("Error updating property status:", error);
        if (connection) {
            await connection.end();
        }
        return res.status(500).json({ message: "Error updating property status" });
    }
}
