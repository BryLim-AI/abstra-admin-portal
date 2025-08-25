import { db } from "@/lib/db";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

async function getCurrentAdminId(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");
  const cookies = cookieHeader ? parse(cookieHeader) : null;
  if (!cookies || !cookies.token) {
    throw new Error("Unauthorized");
  }

  const secretKey = process.env.JWT_SECRET;
  const decoded = jwt.verify(cookies.token, secretKey as string) as any;

  if (!decoded || !decoded.admin_id) {
    throw new Error("Invalid Token");
  }

  return decoded.admin_id;
}
// @ts-ignore
export async function DELETE(req: NextRequest, { params }) {
  try {
    const currentAdminId = await getCurrentAdminId(req);
    const targetAdminId = parseInt(params.admin_id);

    if (!targetAdminId) {
      return NextResponse.json({ success: false, message: "Co-admin ID is required" }, { status: 400 });
    }

    if (targetAdminId === currentAdminId) {
      return NextResponse.json({ success: false, message: "You cannot modify yourself" }, { status: 403 });
    }

    const [result]: any = await db.query("DELETE FROM Admin WHERE admin_id = ?", [targetAdminId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Co-admin not found" }, { status: 404 });
    }

    await db.query(
      "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
      [currentAdminId, `Deleted Co-admin with ID: ${targetAdminId}`]
    );

    return NextResponse.json({ success: true, message: "Co-admin deleted successfully" }, { status: 200 });
  } catch (error: any) {
    const msg = error.message || "Internal Server Error";
    console.error("DELETE error:", msg);
    return NextResponse.json({ success: false, message: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
// @ts-ignore
export async function PATCH(req: NextRequest, { params }) {
  try {
    const currentAdminId = await getCurrentAdminId(req);
    const targetAdminId = parseInt(params.admin_id);

    if (!targetAdminId) {
      return NextResponse.json({ success: false, message: "Co-admin ID is required" }, { status: 400 });
    }

    if (targetAdminId === currentAdminId) {
      return NextResponse.json({ success: false, message: "You cannot modify yourself" }, { status: 403 });
    }

    const { status } = await req.json();

    if (!["active", "disabled"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status value" }, { status: 400 });
    }

    const [updateResult]: any = await db.query(
      "UPDATE Admin SET status = ? WHERE admin_id = ?",
      [status, targetAdminId]
    );

    if (updateResult.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Co-admin not found" }, { status: 404 });
    }

    await db.query(
      "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
      [currentAdminId, `Updated Co-admin - ID: ${targetAdminId} status to ${status}`]
    );

    return NextResponse.json({ success: true, message: `Co-admin ${status} successfully` }, { status: 200 });
  } catch (error: any) {
    const msg = error.message || "Internal Server Error";
    console.error("PATCH error:", msg);
    return NextResponse.json({ success: false, message: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
