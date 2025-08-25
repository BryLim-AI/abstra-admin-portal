import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PUT: Update Bug Report Status
// @ts-ignore
export async function PUT(req: NextRequest, { params }) {
  const report_id = params.report_id;

  try {
    const body = await req.json();
    const { status, adminMessage, updatedByAdmin } = body;

    if (!updatedByAdmin) {
      return NextResponse.json(
        { message: "Admin ID is required" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `UPDATE BugReport 
       SET status = ?, admin_message = ?, updated_by = ?, updated_at = NOW() 
       WHERE report_id = ?`,
      [status, adminMessage, updatedByAdmin, report_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Bug report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Bug report updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
}
