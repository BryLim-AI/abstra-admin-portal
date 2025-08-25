import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, token, platform } = body; // platform = "android" | "ios" | "web"

        if (!userId || !token) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Insert or update FCM token
        await db.query(
            `INSERT INTO FCM_Token (user_id, token, platform)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE token = VALUES(token), platform = VALUES(platform)`,
            [userId, token, platform]
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error saving FCM token:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
