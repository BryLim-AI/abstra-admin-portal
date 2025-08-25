import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { visit_id, status, reason } = body;

    if (!visit_id) {
      return NextResponse.json(
        { message: "Missing visit_id." },
        { status: 400 }
      );
    }

    const validStatuses = ["approved", "disapproved", "cancelled", "pending"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status." },
        { status: 400 }
      );
    }

    if (status === "disapproved" && !reason) {
      return NextResponse.json(
        { message: "Disapproval reason is required." },
        { status: 400 }
      );
    }

    let result;

    switch (status) {
      case "disapproved":
        [result] = await db.query(
          `
          UPDATE PropertyVisit 
          SET status = ?, disapproval_reason = ?, updated_at = NOW() 
          WHERE visit_id = ?
          `,
          [status, reason, visit_id]
        );
        break;

      case "cancelled":
        [result] = await db.query(
          `
          UPDATE PropertyVisit 
          SET status = ?, updated_at = NOW() 
          WHERE visit_id = ?
          `,
          [status, visit_id]
        );
        break;

      default:
        [result] = await db.query(
          `
          UPDATE PropertyVisit 
          SET status = ?, disapproval_reason = NULL, updated_at = NOW() 
          WHERE visit_id = ?
          `,
          [status, visit_id]
        );
    }

    // @ts-ignore
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Visit not found or already updated." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Visit ${status === "cancelled" ? "cancelled" : status} successfully.`,
      updatedStatus: status,
    });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
}
