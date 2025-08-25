import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlordId");

    if (!landlordId) {
        return NextResponse.json({ message: "Landlord ID is required" }, { status: 400 });
    }

    try {
        const [messages] = await db.query(
            `SELECT 
          m.chat_room,
          m.encrypted_message,
          m.iv,
          m.timestamp,
          u.firstName AS encryptedSenderFirstName,
          u.lastName AS encryptedSenderLastName
        FROM Message m
        JOIN User u ON m.sender_id = u.user_id
        WHERE m.receiver_id = ?
        ORDER BY m.timestamp DESC`,
            [landlordId]
        );

        // @ts-ignore
        const decryptedMessages = messages.map((msg: any) => {
            let decryptedMessage = "Unknown";
            let decryptedSenderFirstName = "Unknown";
            let decryptedSenderLastName = "Unknown";

            try {
                // @ts-ignore
                decryptedMessage = decryptData(JSON.parse(msg.encrypted_message), process.env.ENCRYPTION_SECRET!);
                // @ts-ignore
                decryptedSenderFirstName = decryptData(JSON.parse(msg.encryptedSenderFirstName), process.env.ENCRYPTION_SECRET!);
                // @ts-ignore
                decryptedSenderLastName = decryptData(JSON.parse(msg.encryptedSenderLastName), process.env.ENCRYPTION_SECRET!);
            } catch (error) {
                console.error("Decryption error:", error);
            }

            return {
                chat_room: msg.chat_room,
                senderName: `${decryptedSenderFirstName} ${decryptedSenderLastName}`,
                message: decryptedMessage,
                timestamp: msg.timestamp,
            };
        });

        return NextResponse.json(decryptedMessages);
    } catch (error) {
        console.error("Error fetching received messages:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
