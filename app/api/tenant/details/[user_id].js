import mysql from "mysql2/promise";
import { decryptData } from "../../../../crypto/encrypt";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { user_id } = req.query;
    const encryptionKey = process.env.ENCRYPTION_SECRET;

    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [tenantResults] = await db.execute(`
            SELECT
                u.user_id,
                u.firstName,
                u.lastName,
                u.email,
                u.phoneNumber,
                u.birthDate,
                u.userType,
                u.is_active,
                u.emailVerified,
                t.tenant_id,
                u.profilePicture,
                t.createdAt AS tenantCreatedAt
            FROM User u
                     INNER JOIN Tenant t ON u.user_id = t.user_id
            WHERE u.user_id = ?
        `, [user_id]);

        if (tenantResults.length === 0) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        const [activityLogs] = await db.execute(`
            SELECT
                action,
                timestamp
            FROM ActivityLog
            WHERE user_id = ?
            ORDER BY timestamp DESC
        `, [user_id]);

        await db.end();

        console.log("Encrypted Tenant Data:", tenantResults[0]);

        const decryptField = (value, fieldName) => {
            if (!value) return value;

            try {
                const encryptedObject = typeof value === "string" ? JSON.parse(value) : value;

                if (!encryptedObject.iv || !encryptedObject.data || !encryptedObject.authTag) {
                    console.warn(`Invalid encrypted object format for ${fieldName}:`, encryptedObject);
                    return "Error Decrypting Data";
                }

                const decrypted = decryptData(encryptedObject, encryptionKey);
                console.log(` Decrypted ${fieldName}:`, decrypted);
                return decrypted;
            } catch (error) {
                console.error(`Error decrypting ${fieldName}:`, error);
                return "Error Decrypting Data";
            }
        };

        const tenantDetails = {
            user_id: tenantResults[0].user_id,
            tenant_id: tenantResults[0].tenant_id,
            firstName: decryptField(tenantResults[0].firstName, "firstName"),
            lastName: decryptField(tenantResults[0].lastName, "lastName"),
            email: decryptField(tenantResults[0].email, "email"),
            phoneNumber: decryptField(tenantResults[0].phoneNumber, "phoneNumber"),
            birthDate: tenantResults[0].birthDate,
            userType: tenantResults[0].userType,
            emailVerified: tenantResults[0].emailVerified ? true : false,
            profilePicture: tenantResults[0].profilePicture,
            tenantCreatedAt: tenantResults[0].tenantCreatedAt,
            is_active: tenantResults[0].is_active,
            activityLogs: activityLogs.map(log => ({
                action: log.action,
                timestamp: log.timestamp
            }))
        };

        console.log("Tenant Data Response:", tenantDetails);

        return res.status(200).json(tenantDetails);
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
