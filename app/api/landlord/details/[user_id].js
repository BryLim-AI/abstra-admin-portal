import mysql from "mysql2/promise";
import { decryptData } from "../../../../crypto/encrypt";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { user_id } = req.query;

    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [landlordResults] = await db.execute(`
            SELECT 
                u.user_id,
                u.firstName,
                u.lastName,
                u.email,
                u.is_active,
                u.phoneNumber,
                u.birthDate,
                u.userType,
                u.emailVerified,
                l.landlord_id,
                u.profilePicture,
                l.createdAt AS landlordCreatedAt
            FROM User u
            INNER JOIN Landlord l ON u.user_id = l.user_id
            WHERE u.user_id = ?
        `, [user_id]);

        if (landlordResults.length === 0) {
            return res.status(404).json({ error: "Landlord not found" });
        }

        const [activityLogs] = await db.execute(`
            SELECT 
                action, 
                timestamp 
            FROM ActivityLog 
            WHERE user_id = ?
            ORDER BY timestamp DESC
        `, [user_id]);

        const decryptField = (value, fieldName) => {
            if (!value) return value;

            try {
                const encryptedObject = typeof value === "string" ? JSON.parse(value) : value;

                if (!encryptedObject.iv || !encryptedObject.data || !encryptedObject.authTag) {
                    console.warn(`Invalid encrypted object format for ${fieldName}:`, encryptedObject);
                    return "DECRYPTION_ERROR";
                }

                const decrypted = decryptData(encryptedObject, encryptionKey);
                console.log(`✅ Decrypted ${fieldName}:`, decrypted);
                return decrypted;
            } catch (error) {
                console.error(`Error decrypting ${fieldName}:`, error);
                return "DECRYPTION_ERROR";
            }
        };

        const encryptionKey = process.env.ENCRYPTION_SECRET;

        const landlordDetails = {
            user_id: landlordResults[0].user_id,
            landlord_id: landlordResults[0].landlord_id,
            firstName: decryptField(landlordResults[0].firstName, "firstName"),
            lastName: decryptField(landlordResults[0].lastName, "lastName"),
            email:decryptField(landlordResults[0].email, "email"),
            phoneNumber: decryptField(landlordResults[0].phoneNumber, "phoneNumber"),
            birthDate: landlordResults[0].birthDate,
            is_active: landlordResults[0].is_active,
            userType: landlordResults[0].userType,
            emailVerified: landlordResults[0].emailVerified ? true : false,
            profilePicture: landlordResults[0].profilePicture,
            landlordCreatedAt: landlordResults[0].landlordCreatedAt,
            activityLogs: activityLogs.map(log => ({
                action: log.action,
                timestamp: log.timestamp
            }))
        };

        return res.status(200).json(landlordDetails);
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
