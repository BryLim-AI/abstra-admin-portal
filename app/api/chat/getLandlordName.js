import { db } from "../../../lib/db";
import {decryptData} from "../../../crypto/encrypt";


export default async function getLandlordName(req, res) {
    const { landlord_id } = req.query;

    if (!landlord_id) return res.status(400).json({ error: "Missing landlord_id" });

    try {
        const [results] = await db.query(
            `SELECT u.firstName, u.lastName
             FROM User u
                      JOIN Landlord l ON u.user_id = l.user_id
             WHERE l.landlord_id = ?`,
            [landlord_id]
        );

        if (!results || results.length === 0) {
            return res.status(404).json({ error: "Landlord not found" });
        }

        const landlord = results[0];

        // Decrypt data
        const decryptedFirstName = decryptData(JSON.parse(landlord.firstName), process.env.ENCRYPTION_SECRET);
        const decryptedLastName = decryptData(JSON.parse(landlord.lastName), process.env.ENCRYPTION_SECRET);

        res.status(200).json({ landlordName: `${decryptedFirstName} ${decryptedLastName}` });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}