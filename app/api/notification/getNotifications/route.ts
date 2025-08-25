import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notifications?userId=...
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // @ts-ignore
        const [notifications] = await db.query(
            `SELECT id, title, body, is_read, created_at 
       FROM Notification 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
            [userId]
        );

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// PATCH /api/notifications
export async function PATCH(req: Request) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
        }

        await db.query(
            `UPDATE Notification 
       SET is_read = 1 
       WHERE id = ?`,
            [id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
