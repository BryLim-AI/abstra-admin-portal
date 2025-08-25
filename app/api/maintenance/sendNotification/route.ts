import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request_id, status } = body;

    if (!request_id || !status) {
      return NextResponse.json(
        { error: "Missing request_id or status" },
        { status: 400 }
      );
    }

    const [maintenanceRequest] = await db.execute(
      `SELECT mr.tenant_id, t.user_id AS tenant_user_id, mr.subject, mr.schedule_date
       FROM MaintenanceRequest mr
       JOIN Tenant t ON mr.tenant_id = t.tenant_id
       WHERE mr.request_id = ?`,
      [request_id]
    );
// @ts-ignore
    if (!maintenanceRequest.length) {
      return NextResponse.json(
        { error: "Maintenance request not found" },
        { status: 404 }
      );
    }
// @ts-ignore
    const { tenant_user_id, subject, schedule_date } = maintenanceRequest[0];

    // Construct notification message
    let notificationMessage = `Your maintenance request for "${subject}" has been updated to "${status}".`;

    if (schedule_date) {
      notificationMessage += ` The scheduled date is on ${new Date(schedule_date).toLocaleDateString()}.`;
    } else if (status === "completed") {
      notificationMessage += ` The request has been marked as completed.`;
    }

    // Insert into Notification table
    await db.execute(
      `INSERT INTO Notification (user_id, title, body, is_read, created_at) 
       VALUES (?, ?, ?, 0, NOW())`,
      [tenant_user_id, "Maintenance Request Update", notificationMessage]
    );

    return NextResponse.json(
      { success: true, message: "Notification sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
