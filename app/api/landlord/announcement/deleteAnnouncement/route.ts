import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export async function DELETE(req: NextRequest) {
  try {
    // Parse cookies to get the token
    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : null;

    if (!cookies || !cookies.token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(cookies.token, secretKey);
    const loggedUser = payload.user_id;

    // Extract ID from search params
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing announcement ID" },
        { status: 400 }
      );
    }

    // Check if announcement exists
    const checkQuery =
      "SELECT announcement_id FROM Announcement WHERE announcement_id = ?";
    const [existingRows] = await db.execute(checkQuery, [id]);

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Perform delete
    const deleteQuery =
      "DELETE FROM Announcement WHERE announcement_id = ?";
    await db.execute(deleteQuery, [id]);

    // Log activity
    await db.query(
      "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
      [loggedUser, `Deleted Announcement ID: ${id}`]
    );

    return NextResponse.json({
      message: "Announcement deleted successfully",
      id,
    });
  } catch (error: any) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
