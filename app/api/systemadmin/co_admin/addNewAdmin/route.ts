import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { roles } from "@/constant/adminroles";
import { encryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import CryptoJS from "crypto-js";

export async function POST(req: NextRequest) {
  let currentLoggedAdmin;

  try {
    // Parse cookies and verify JWT
    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : null;

    if (!cookies || !cookies.token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(cookies.token, secretKey);
    currentLoggedAdmin = payload.admin_id;

    const body = await req.json();
    const {
      email,
      username,
      password,
      role,
      first_name,
      last_name,
      permissions,
    } = body;

    // Validate role
    if (!roles.some((r) => r.value === role)) {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }

    // Validate required fields
    if (!username || !password || !role || !email || !permissions) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ error: "Invalid permissions format." }, { status: 400 });
    }

    const emailHash = CryptoJS.SHA256(email).toString();

    // Check if email or username already exists
    const [existingUser]: any = await db.execute(
      "SELECT email_hash, username FROM Admin WHERE email_hash = ? OR username = ?",
      [emailHash, username]
    );

    if (existingUser.length > 0) {
      if (existingUser[0].email_hash === emailHash) {
        return NextResponse.json({ error: "Email already exists." }, { status: 409 });
      }
      if (existingUser[0].username === username) {
        return NextResponse.json({ error: "Username already exists." }, { status: 409 });
      }
    }

    const encryptedEmail = JSON.stringify(encryptData(email, process.env.ENCRYPTION_SECRET!));
    const encryptedFirstName = JSON.stringify(encryptData(first_name, process.env.ENCRYPTION_SECRET!));
    const encryptedLastName = JSON.stringify(encryptData(last_name, process.env.ENCRYPTION_SECRET!));
    const hashedPassword = await bcrypt.hash(password, 10);
    const permissionsString = permissions.join(",");

    await db.execute(
      `INSERT INTO Admin (admin_id, username, first_name, last_name, email_hash, email, password, role, permissions)
       VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        encryptedFirstName,
        encryptedLastName,
        emailHash,
        encryptedEmail,
        hashedPassword,
        role,
        permissionsString,
      ]
    );

    await db.query(
      `INSERT INTO ActivityLog (admin_id, action, timestamp)
       VALUES (?, ?, NOW())`,
      [currentLoggedAdmin, `Added new Co-admin ${username}`]
    );

    return NextResponse.json({ message: "Admin registered successfully." }, { status: 201 });
  } catch (err: any) {
    console.error("Error registering admin:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
