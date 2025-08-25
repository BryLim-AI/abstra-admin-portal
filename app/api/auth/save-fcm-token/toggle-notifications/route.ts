import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, token, platform, active } = body;


        if (!userId || !token || !platform || typeof active !== "boolean") {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const activeValue = active ? 1 : 0;

        const sql = `
            UPDATE FCM_Token
            SET active = ?
            WHERE user_id = ? AND token = ? AND platform = ?
        `;

        const [result] = await db.execute(sql, [
            activeValue,
            userId,
            token,
            platform,
        ]);

        return NextResponse.json({
            success: true,        // @ts-ignore
            updated: result.affectedRows || 0,
        });
    } catch (err) {
        console.error("Error toggling notification:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
