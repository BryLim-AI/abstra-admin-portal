import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("user_id");
        const platform = req.nextUrl.searchParams.get("platform");
        console.log('received id', userId);
        if (!userId) {
            return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
        }
        if (!platform) {
            return NextResponse.json({ error: "Missing platform" }, { status: 400 });
        }

        const sql = `
      SELECT token, active
      FROM FCM_Token
      WHERE user_id = ? AND platform = ?
      LIMIT 1
    `;

        const [rows]: any = await db.execute(sql, [userId, platform]);

        if (!rows.length) {
            return NextResponse.json({ status: false });
        }

        const status = rows[0].active === 1;
        const token = rows[0].token;

        return NextResponse.json({ status, token });
    } catch (err) {
        console.error("Error fetching FCM status:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
