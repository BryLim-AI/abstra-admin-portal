import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // your existing MySQL connection
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const { userId, token, platform } = await req.json();
        if (!userId || !token || !platform) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const id = uuidv4();

        const sql = `
      INSERT INTO FCM_Token (id, user_id, token, platform)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        token = VALUES(token),
        platform = VALUES(platform),
        updatedAt = CURRENT_TIMESTAMP
    `;
        await db.execute(sql, [id, userId, token, platform]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error saving FCM token:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
