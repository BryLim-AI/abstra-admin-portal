import { db } from "@/lib/db";
import { deleteFromS3 } from "@/lib/s3";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse JWT from cookie
    const cookieStore = cookies();
    // @ts-ignore
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
    let decoded: any;
    try {
      const { payload } = await jwtVerify(token, secretKey);
      decoded = payload;
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid Token" }, { status: 401 });
    }

    if (!decoded || !decoded.admin_id) {
      return NextResponse.json({ success: false, message: "Invalid Token Data" }, { status: 401 });
    }

    const currentAdminId = decoded.admin_id;

    // 2. Parse body
    const { landlord_id, status, message } = await req.json();

    // 3. Fetch verification & user info
    const [rows] = await db.execute<any[]>(
      `
      SELECT lv.status AS verification_status,
             lv.reviewed_by,
             lv.document_url,
             lv.selfie_url,
             l.user_id
      FROM LandlordVerification lv
      JOIN Landlord l ON lv.landlord_id = l.landlord_id
      JOIN User u ON l.user_id = u.user_id
      WHERE lv.landlord_id = ?
      `,
      [landlord_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Landlord not found." }, { status: 404 });
    }

    const { user_id, document_url, selfie_url } = rows[0];

    if (status.toLowerCase() === "rejected") {
      // 4a. Delete S3 assets
      if (document_url) await deleteFromS3(document_url);
      if (selfie_url) await deleteFromS3(selfie_url);

      // 4b. Delete verification entry
      await db.execute("DELETE FROM LandlordVerification WHERE landlord_id = ?", [landlord_id]);

      // 4c. Send rejection notification
      const title = "Landlord Verification Rejected";
      const body = `Your verification has been REJECTED. Please submit again.${message ? ` Reason: ${message}` : ""}`;

      await db.execute(
        `INSERT INTO Notification (user_id, title, body, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
        [user_id, title, body]
      );

      return NextResponse.json({ message: "Verification rejected and data deleted successfully." });
    } else {
      // 5. Approve or pending update
      await db.query(
        `
        UPDATE LandlordVerification
        SET status = ?, reviewed_by = ?, review_date = NOW(), message = ?
        WHERE landlord_id = ?
        `,
        [status, currentAdminId, message, landlord_id]
      );

      await db.query(
        `
        UPDATE Landlord SET is_verified = ?
        WHERE landlord_id = ?
        `,
        [status === "approved" ? 1 : 0, landlord_id]
      );

      const title = `Landlord Verification ${status}`;
      const body = `Your landlord verification has been ${status.toUpperCase()} by the admin.${message ? ` Message: ${message}` : ""}`;

      await db.execute(
        `INSERT INTO Notification (user_id, title, body, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
        [user_id, title, body]
      );

      return NextResponse.json({ message: `Verification ${status} successfully.` });
    }
  } catch (error: any) {
    console.error("[Update Landlord Verification] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
