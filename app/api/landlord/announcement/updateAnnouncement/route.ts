import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";
import { parse } from "cookie";

export async function PUT(req: NextRequest) {
  try {
    // Parse cookies to get the JWT
    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : null;

    if (!cookies || !cookies.token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify JWT
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(cookies.token, secretKey);
    const loggedUser = payload.user_id;

    // Get data from body and query
    const body = await req.json();
    const { subject, description, property_id } = body;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Announcement ID is required" },
        { status: 400 }
      );
    }

    if (!subject || !description || !property_id) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: subject, description, and property_id are required",
        },
        { status: 400 }
      );
    }

    // Check if announcement exists
    const checkQuery =
      "SELECT announcement_id FROM Announcement WHERE announcement_id = ?";
    const [existingRows] = await db.execute(checkQuery, [id]);

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json(
        { message: "Announcement not found" },
        { status: 404 }
      );
    }

    // Update announcement
    const updateQuery = `
      UPDATE Announcement 
      SET subject = ?,
          description = ?,
          property_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE announcement_id = ?
    `;

    await db.execute(updateQuery, [subject, description, property_id, id]);

    // Log activity
    await db.query(
      "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
      [loggedUser, `Edited Announcement #${id}`]
    );

    return NextResponse.json({
      message: "Announcement updated successfully",
      id,
    });
  } catch (error: any) {
    console.error("Error updating announcement:", error.message, error.stack);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
