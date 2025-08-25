import { db } from "../../../lib/db";
import {decryptData} from "../../../crypto/encrypt";

export default async function handler(req, res) {
    const { support_id } = req.query;

    if (req.method === "GET") {
        try {
            console.log(`Fetching support request from DB with ID: ${support_id}`);

            const [results] = await db.query("SELECT * FROM SupportRequest WHERE support_id = ?", [support_id]);

            if (!results || results.length === 0) {
                console.error("No support request found.");
                return res.status(404).json({ error: "Support request not found." });
            }

            const supportRequests = results.map(results => ({
                ...results,
                email: decryptData(JSON.parse(results.email), process.env.ENCRYPTION_SECRET),
            }));

            return res.status(200).json(supportRequests[0]);

        } catch (error) {
            console.error("API Error:", error);
            return res.status(500).json({ error: "Failed to fetch support request." });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
