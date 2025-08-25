import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const { unitId, status, message, tenant_id } = await req.json();

    console.log("Received Payload:", { unitId, status, message, tenant_id });

    // Validate status
    if (!["pending", "approved", "disapproved"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    if (status === "disapproved" && (!message || message.trim() === "")) {
      return NextResponse.json(
        { message: "Disapproval message is required" },
        { status: 400 }
      );
    }

    // Fetch user_id from Tenant table
    const [tenantResult] = await db.query(
      "SELECT user_id FROM Tenant WHERE tenant_id = ?",
      [tenant_id]
    );

    // @ts-ignore
    if (!tenantResult || tenantResult.length === 0) {
      return NextResponse.json(
        { message: "Tenant not found" },
        { status: 404 }
      );
    }

    // @ts-ignore
    const user_id = tenantResult[0].user_id;

    // Update status and optional message
    await db.query(
      `UPDATE ProspectiveTenant 
       SET status = ?, message = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE unit_id = ? AND tenant_id = ?`,
      [status, message || null, unitId, tenant_id]
    );

    // Insert notification
    const notificationMessage =
      status === "approved"
        ? "Your tenant application has been approved! Check your lease agreement."
        : `Your tenant application was disapproved. Reason: ${message}`;

    await db.query(
      `INSERT INTO Notification (user_id, title, body, is_read, created_at)
       VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [user_id, "Tenant Application Update", notificationMessage]
    );

    return NextResponse.json(
      { message: `Tenant application ${status} successfully!` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating tenant status:", error);
    return NextResponse.json(
      { message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}
