import { db } from "../../../lib/db";
import {encryptData} from "../../../crypto/encrypt";

export default async function SendSupport(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed. Use POST." });
    }

    try {
        const { email, selectedIssue, message } = req.body;

        if (!email || !selectedIssue || !message) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        console.log("Received support request:", { email, selectedIssue, message });
        const emailEncrypted = JSON.stringify( encryptData(email, process.env.ENCRYPTION_SECRET));

        await db.query(
            `INSERT INTO SupportRequest (email, issue, message, status) VALUES (?, ?, ?, 'Pending')`,
            [emailEncrypted, selectedIssue, message]
        );

        return res.status(200).json({ message: "Support request submitted successfully." });

    } catch (error) {
        console.error("Error handling support request:", error);
        return res.status(500).json({ error: "Internal Server Error. Please try again later." });
    }
}
