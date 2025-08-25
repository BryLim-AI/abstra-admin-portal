import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function viewActivityLogs(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method Not Allowed. Only GET requests are allowed for fetching logs."
        });
    }

    try {
        // Fetch logs with joined user/admin info
        const [activityLogs] = await db.query(`
            SELECT
                a.log_id,
                a.user_id,
                a.admin_id,
                u.firstName,
                u.lastName,
                ad.username AS adminUsername,
                a.action,
                a.timestamp
            FROM ActivityLog a
                     LEFT JOIN User u ON a.user_id = u.user_id
                     LEFT JOIN Admin ad ON a.admin_id = ad.admin_id
        `);

        const logs = activityLogs.map(log => {
            const decryptedLog = { ...log };

            try {
                if (log.firstName) {
                    const encryptedFirstName = JSON.parse(log.firstName);
                    const decryptedFirstName = decryptData(encryptedFirstName, process.env.ENCRYPTION_SECRET);
                    decryptedLog.firstName = decryptedFirstName;
                }

                if (log.lastName) {
                    const encryptedLastName = JSON.parse(log.lastName);
                    const decryptedLastName = decryptData(encryptedLastName, process.env.ENCRYPTION_SECRET);
                    decryptedLog.lastName = decryptedLastName;
                }

                console.log("Decrypted First Name:", decryptedLog.firstName);
                console.log("Decrypted Last Name:", decryptedLog.lastName);
            } catch (decryptionError) {
                console.error(`Decryption failed for log ID ${log.log_id}:`, decryptionError);
                decryptedLog.firstName = null;
                decryptedLog.lastName = null;
            }

            return decryptedLog;
        });



        return res.status(200).json({ logs });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return res.status(500).json({ error: "Failed to fetch activity logs." });
    }
}
