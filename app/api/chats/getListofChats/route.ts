import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    try {
        const [chatList] = await db.query(
            `SELECT DISTINCT
          m.chat_room,
          u.firstName AS encryptedFirstName,
          u.lastName AS encryptedLastName,
          (SELECT encrypted_message FROM Message WHERE chat_room = m.chat_room ORDER BY timestamp DESC LIMIT 1) AS lastMessage,
          u.user_id AS chatUserId,
          t.tenant_id, 
          l.landlord_id
       FROM Message m
       JOIN User u ON (m.receiver_id = u.user_id OR m.sender_id = u.user_id)
       LEFT JOIN Tenant t ON u.user_id = t.user_id
       LEFT JOIN Landlord l ON u.user_id = l.user_id
       WHERE (m.sender_id = ? OR m.receiver_id = ?)
         AND u.user_id != ? 
       ORDER BY lastMessage DESC`,
            [userId, userId, userId]
        );

        const decryptedChatList = chatList.map((chat: any) => {
            let decryptedFirstName = "Unknown";
            let decryptedLastName = "Unknown";

            try {
                decryptedFirstName = decryptData(JSON.parse(chat.encryptedFirstName), process.env.ENCRYPTION_SECRET!);
                decryptedLastName = decryptData(JSON.parse(chat.encryptedLastName), process.env.ENCRYPTION_SECRET!);
            } catch (error) {
                console.error("Decryption error:", error);
            }

            return {
                chat_room: chat.chat_room,
                name: `${decryptedFirstName} ${decryptedLastName}`,
                lastMessage: chat.lastMessage || "No messages yet",
                chatUserId: chat.chatUserId,
                tenant_id: chat.tenant_id || null,
                landlord_id: chat.landlord_id,
            };
        });

        return NextResponse.json(decryptedChatList);
    } catch (error) {
        console.error("Error fetching chats:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
