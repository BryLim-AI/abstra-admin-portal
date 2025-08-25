
// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require("express");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createServer } = require("http");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Server } = require("socket.io");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mysql = require("mysql2/promise");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require("node:crypto");
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env" });
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pool = require("./lib/chat-db");
// const chatRoutes = require("./routes/chatRoutes");

const app = express();
// app.use("/api/chats", chatRoutes);

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "https://hestia-chat-client.onrender.com",
            "http://localhost:3000"
        ],
        methods: ["GET", "POST"],
    },
});

//region ENCRYPT AND DECRYPT MESSAGESS
const encryptMessage = (message) => {
    if (!message || typeof message !== "string") {
        console.error("Encryption Error: Invalid message.");
        return { encrypted: "", iv: "" }; // Return empty values to prevent errors
    }

    const iv = crypto.randomBytes(16);
    const secretKey = process.env.CHAT_ENCRYPTION_SECRET;

    if (!secretKey) {
        console.error(" Missing CHAT_ENCRYPTION_SECRET in .env file");
        return { encrypted: "", iv: "" };
    }

    const key = crypto.createHash("sha256").update(secretKey).digest();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");

    return { encrypted, iv: iv.toString("hex") };
};
const decryptMessage = (encryptedMessage, iv) => {
    if (!encryptedMessage || !iv) {
        console.error("Decryption Error: Missing encrypted message or IV.");
        return "[Decryption Error]";
    }

    try {
        const key = crypto.createHash("sha256").update(process.env.CHAT_ENCRYPTION_SECRET).digest();
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(iv, "hex"));
        let decrypted = decipher.update(encryptedMessage, "hex", "utf-8");
        decrypted += decipher.final("utf-8");
        return decrypted;
    } catch (error) {
        console.error("Decryption Failed:", error.message);
        return "[Decryption Error]";
    }
};
//endregion

io.on("connection", (socket) => {
    console.log(` New client connected: ${socket.id}`);

    socket.on("joinRoom", async ({ chatRoom }) => {
        try {
            if (!chatRoom) {
                console.error(` Invalid chatRoom received. ${chatRoom}`);
                return;
            }

            socket.join(chatRoom);
            console.log(`User joined room: ${chatRoom}`);

            const [messages] = await pool.query(
                `SELECT m.*, u.firstName FROM Message m
                 JOIN User u ON m.sender_id = u.user_id
                 WHERE chat_room = ? ORDER BY timestamp ASC`,
                [chatRoom]
            );

            const decryptedMessages = messages.map((msg) => ({
                sender_id: msg.sender_id,
                sender_name: msg.firstName,
                receiver_id: msg.receiver_id,
                message: decryptMessage(msg.encrypted_message, msg.iv),
                timestamp: msg.timestamp,
            }));

            io.to(chatRoom).emit("loadMessages", decryptedMessages);
        } catch (error) {
            console.error("Error loading messages:", error.message);
        }
    });

    socket.on("sendMessage", async ({ sender_id, sender_type, receiver_id, receiver_type, message, chat_room }) => {
        try {
            console.log(`Received message data:`, { sender_id, sender_type, receiver_id, receiver_type, message, chat_room });

            if (!chat_room) {
                console.error("Error: Chat room is undefined!");
                return;
            }

            // Fetch sender's `user_id` using their `tenant_id` or `landlord_id`
            let senderQuery = sender_type === 'tenant'
                ? 'SELECT user_id FROM Tenant WHERE tenant_id = ?'
                : 'SELECT user_id FROM Landlord WHERE landlord_id = ?';

            let [senderResult] = await pool.query(senderQuery, [sender_id]);

            if (senderResult.length === 0) {
                console.error("Error: Sender not found in database. Sender ID:", sender_id);
                return;
            }

            const senderUserId = senderResult[0].user_id;

            // Fetch receiver's `user_id` using their `tenant_id` or `landlord_id`
            let receiverQuery = receiver_type === 'tenant'
                ? 'SELECT user_id FROM Tenant WHERE tenant_id = ?'
                : 'SELECT user_id FROM Landlord WHERE landlord_id = ?';

            let [receiverResult] = await pool.query(receiverQuery, [receiver_id]);

            if (receiverResult.length === 0) {
                console.error(" Error: Receiver not found in database. Receiver ID (tenant_id or landlord_id):", receiver_id);
                return;
            }

            // Convert `tenant_id` or `landlord_id` to `user_id`
            const receiverUserId = receiverResult[0].user_id;

// this is a check if the tenant has no message hostry yet.
            const [existingMessages] = await pool.query(
                "SELECT COUNT(*) AS messageCount FROM Message WHERE chat_room = ? AND sender_id = ? AND receiver_id = ?",
                [chat_room, senderUserId, receiverUserId]
            );

            const isFirstChat = existingMessages[0].messageCount === 0;

            console.log(`Received Message IDs - Sender: ${sender_id} (user_id: ${senderUserId}), Receiver: ${receiver_id} (user_id: ${receiverUserId})`);

            const { encrypted, iv } = encryptMessage(message);


            await pool.query(
                "INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)",
                [senderUserId, receiverUserId, encrypted, iv, chat_room]
            );

            console.log(`Message saved to DB: ChatRoom - ${chat_room}`);

            io.to(chat_room).emit("receiveMessage", {
                sender_id: senderUserId,
                receiver_id: receiverUserId,
                message,
                timestamp: new Date(),
            });

            //region AUTOMATED MESSAGE FOR NEW MAINTENANCE REQUEST ONLY
            if (sender_type === "tenant" && message.toLowerCase().includes("maintenance request")){
                console.log("Detected maintenance request. Sending auto-reply from landlord...");

                const [landlordResult] = await pool.query(
                    `SELECT p.landlord_id 
                     FROM Unit u
                     JOIN Property p ON u.property_id = p.property_id
                     WHERE u.unit_id = ?`,
                    [unit_id]
                );

                if (landlordResult.length > 0) {
                    const landlordId = landlordResult[0].landlord_id;

                    // Fetch landlord's `user_id`
                    const [landlordUserResult] = await pool.query(
                        `SELECT user_id FROM Landlord WHERE landlord_id = ?`,
                        [landlordId]
                    );

                    if (landlordUserResult.length > 0) {
                        const landlordUserId = landlordUserResult[0].user_id;

                        // Define the automated response from the landlord
                        const landlordMessage = `Hello! Your maintenance request has been received. I will review it and update you soon.`;

                        const { encrypted: encryptedLandlordMessage, iv: landlordIv } = encryptMessage(landlordMessage);

                        // Store landlord's automated response in the database
                        await pool.query(
                            "INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)",
                            [landlordUserId, senderUserId, encryptedLandlordMessage, landlordIv, chat_room]
                        );

                        io.to(chat_room).emit("receiveMessage", {
                            sender_id: landlordUserId,
                            receiver_id: senderUserId,
                            message: landlordMessage,
                            timestamp: new Date(),
                        });

                    }else{
                        console.error("Error: Landlord user_id not found.");

                    }
                    }else{
                    console.error("Error: Landlord not found for this unit.");
                }
                }
            //endregion

            //region ONLY FIRST TIME CHAT PRE-SET RESPONSE
            if (isFirstChat && sender_type === "tenant" && receiver_type === "landlord") {
                console.log("🟢 First chat detected from tenant to landlord. Sending auto-reply...");

                const autoMessage = `Hello! Thank you for reaching out. I will respond to your inquiry as soon as possible. Let me know how I can assist you.`;

                const { encrypted: encryptedAutoMessage, iv: autoIv } = encryptMessage(autoMessage);

                await pool.query(
                    "INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)",
                    [receiverUserId, senderUserId, encryptedAutoMessage, autoIv, chat_room]
                );

                io.to(chat_room).emit("receiveMessage", {
                    sender_id: receiverUserId,
                    receiver_id: senderUserId,
                    message: autoMessage,
                    timestamp: new Date(),
                });

                console.log("Auto-message sent from landlord.");
            }
            //endregion

        } catch (error) {
            console.error("Error sending message:", error);
        }
    });
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.CHAT_PORT || 3001;
server.listen(4000, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});