import { db } from "../../../lib/db";
import {decryptData } from "../../../crypto/encrypt";

import crypto from "crypto";

const decryptMessage = (encryptedMessage, iv) => {
    if (!encryptedMessage || !iv) {
        console.error("Decryption Error: Missing encrypted message or IV.");
        return "[Decryption Error]";
    }

    try {
        const key = crypto.createHash("sha256").update(process.env.CHAT_ENCRYPTION_SECRET).digest();

        if (Buffer.from(iv, "hex").length !== 16) {
            console.error("IV Length Invalid. Expected 16 bytes.");
            return "[IV Error]";
        }

        const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(iv, "hex"));
        let decrypted = decipher.update(encryptedMessage, "hex", "utf-8");
        decrypted += decipher.final("utf-8");

        return decrypted;
    } catch (error) {
        console.error("Decryption Failed:", error.message);
        return "[Decryption Error]";
    }
};

export default async function getChatroomDetails(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { chat_room } = req.query;

    if (!chat_room) {
        return res.status(400).json({ message: "chat_room is required" });
    }

    try {
        const [messages] = await db.query(
            `SELECT m.*, u.firstName, u.lastName, u.profilePicture, m.iv, m.encrypted_message
             FROM Message m
             JOIN User u ON m.sender_id = u.user_id
             WHERE m.chat_room = ?
             ORDER BY timestamp ASC`,
            [chat_room]
        );

        if (messages.length === 0) {
            return res.status(404).json({ error: "No messages found" });
        }

        const decryptedMessages = messages.map((msg) => ({
            ...msg,
            message: decryptMessage(msg.encrypted_message, msg.iv),
            profilePicture: msg.profilePicture
                ? decryptData(JSON.parse(msg.profilePicture), process.env.ENCRYPTION_SECRET)
                : "/ou.jpg",
        }));

        console.log("Decrypted Messages Sent to Frontend:", decryptedMessages);
        res.status(200).json(decryptedMessages);

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
