import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import { decryptData } from "@/crypto/encrypt";

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching all admins except the logged-in user...");

    // Get cookies and token from the request
    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : null;

    if (!cookies || !cookies.token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify JWT
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    let decoded;
    try {
      const { payload } = await jwtVerify(cookies.token, secretKey);
      decoded = payload;
    } catch (err) {
      console.error("JWT verification error:", err);
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.admin_id) {
      return NextResponse.json(
        { success: false, message: "Invalid Token Data" },
        { status: 401 }
      );
    }

    const currentAdminId = decoded.admin_id;
    const encryptionKey = process.env.ENCRYPTION_SECRET;

    // Fetch all admins except the logged-in admin
    const [decryptedAdmins]: any = await db.query(
      "SELECT admin_id, username, email, status FROM Admin WHERE admin_id != ?",
      [currentAdminId]
    );

    if (!decryptedAdmins || decryptedAdmins.length === 0) {
      return NextResponse.json(
        { success: false, message: "No record found" },
        { status: 200 }
      );
    }

    const admins = decryptedAdmins.map((admin: any) => ({
      ...admin,
      email: decryptData(JSON.parse(admin.email), encryptionKey),
      status: admin.status,
    }));

    console.log("Admins fetched:", admins);
    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
