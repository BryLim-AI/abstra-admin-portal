import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user_id, subject, description } = await req.json();

    if (!user_id || !subject || !description) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO BugReport (user_id, subject, description) VALUES (?, ?, ?)`,
      [user_id, subject, description]
    );

    return NextResponse.json(
      { message: "Bug report submitted successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting bug report:", error);
    return NextResponse.json(
      { error: "Failed to submit bug report." },
      { status: 500 }
    );
  }
}
