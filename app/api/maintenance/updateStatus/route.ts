import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { io } from "socket.io-client";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      request_id,
      status,
      schedule_date,
      completion_date,
      landlord_id,
    } = body;

    if (!request_id || !status || !landlord_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let query = `UPDATE MaintenanceRequest SET status = ?, updated_at = NOW()`;
    const values: any[] = [status];

    if (schedule_date) {
      query += `, schedule_date = ?`;
      values.push(schedule_date);
    }

    if (completion_date) {
      query += `, completion_date = ?`;
      values.push(completion_date);
    }

    query += ` WHERE request_id = ?`;
    values.push(request_id);

    await db.query(query, values);

    const [maintenanceRequest] = await db.execute(
      `SELECT mr.tenant_id, t.user_id AS tenant_user_id, mr.subject
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
    const { tenant_id, subject, tenant_user_id } = maintenanceRequest[0];

    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
      { autoConnect: true }
    );

    const chat_room = `chat_${[tenant_user_id, landlord_id].sort().join("_")}`;

    const autoMessage = {
      sender_id: landlord_id,
      sender_type: "landlord",
      receiver_id: tenant_id,
      receiver_type: "tenant",
      message: `The status of your maintenance request for "${subject}" has been updated to "${status}".`,
      chat_room,
    };

    socket.emit("sendMessage", autoMessage);

    return NextResponse.json(
      {
        success: true,
        message: "Maintenance request updated successfully, tenant notified",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating maintenance request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
