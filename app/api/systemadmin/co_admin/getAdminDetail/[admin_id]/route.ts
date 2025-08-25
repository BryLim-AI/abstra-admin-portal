import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { jwtVerify } from "jose";
import { parse } from "cookie";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
export async function GET(req: NextRequest, { params }) {
  try {
    const admin_id = params.admin_id;

    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : {};
    const token = cookies.token;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    const loggedAdminId = payload.admin_id;

    const [admins] = await db.query(
      "SELECT admin_id, username, email, role, status FROM Admin WHERE admin_id = ?",
      [admin_id]
    );
// @ts-ignore
    if (admins.length === 0) {
      return NextResponse.json({ success: false, message: "Co-admin not found" }, { status: 404 });
    }

    const encryptionKey = process.env.ENCRYPTION_SECRET;
    // @ts-ignore
    const admin = admins.map((admin: any) => ({
      ...admin,
      email: decryptData(JSON.parse(admin.email), encryptionKey),
      status: admin.status,
    }));

    const [activityLog] = await db.query(
      "SELECT action, timestamp FROM ActivityLog WHERE admin_id = ? ORDER BY timestamp DESC",
      [admin_id]
    );

    if (loggedAdminId) {
      await db.query(
        "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
          // @ts-ignore
        [loggedAdminId, `Viewed Co-Admin: ${admins[0].username}`]
      );
    }

    return NextResponse.json(
      { success: true, admin: admin[0], activityLog },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin details:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
// @ts-ignore
export async function PATCH(req: NextRequest, { params }) {
  try {
    const admin_id = params.admin_id;
    const body = await req.json();
    const { username, password, email, role, status } = body;

    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : {};
    const token = cookies.token;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    const loggedAdminId = payload.admin_id;

    let query = "UPDATE Admin SET";
    const paramsArray: any[] = [];
    const logActions: string[] = [];

    if (username) {
      query += " username = ?";
      paramsArray.push(username);
      logActions.push(`Updated username to ${username}`);
    }

    if (email) {
      if (paramsArray.length > 0) query += ",";
      query += " email = ?";
      paramsArray.push(email);
      logActions.push(`Updated email to ${email}`);
    }

    if (role) {
      if (paramsArray.length > 0) query += ",";
      query += " role = ?";
      paramsArray.push(role);
      logActions.push(`Updated role to ${role}`);
    }

    if (status) {
      if (paramsArray.length > 0) query += ",";
      query += " status = ?";
      paramsArray.push(status);
      logActions.push(`Updated status to ${status}`);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      if (paramsArray.length > 0) query += ",";
      query += " password = ?";
      paramsArray.push(hashedPassword);
      logActions.push(`Updated password (hashed)`);
    }

    query += " WHERE admin_id = ?";
    paramsArray.push(admin_id);

    if (paramsArray.length === 1) {
      return NextResponse.json({ success: false, message: "No updates provided" }, { status: 400 });
    }

    const [updateResult]: any = await db.query(query, paramsArray);

    if (updateResult.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Co-admin not found" }, { status: 404 });
    }

    if (logActions.length > 0) {
      await db.query(
        "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
        [loggedAdminId, `Updated Co-admin (ID: ${admin_id}): ${logActions.join(", ")}`]
      );
    }

    return NextResponse.json({ success: true, message: "Co-admin updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating co-admin:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
