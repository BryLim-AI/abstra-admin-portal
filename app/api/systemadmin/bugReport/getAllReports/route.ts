import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching users from database...");

    const [bugReports] = await db.query(
      `SELECT report_id, user_id, subject, description, created_at, status FROM BugReport`
    );

    console.log("Reports fetched:", bugReports);
    return NextResponse.json({ success: true, bugReports }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
