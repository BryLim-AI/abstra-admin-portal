
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    const emailHash = crypto.createHash("sha256").update(email).digest("hex");

    const [user]: any[] = await db.query(
      "SELECT user_id FROM User WHERE emailHashed = ?",
      [emailHash]
    );

    if (!user || user.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userId = user[0].user_id;

    const [otpRow]: any[] = await db.query(
      `SELECT token, expires_at, used_at 
       FROM UserToken 
       WHERE user_id = ? AND token = ? 
       AND token_type = 'password_reset'`,
      [userId, otp]
    );

    if (!otpRow || otpRow.length === 0) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    const otpData = otpRow[0];

    if (new Date(otpData.expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    if (otpData.used_at !== null) {
      return NextResponse.json({ error: "OTP has already been used." }, { status: 400 });
    }

    await db.query(
      "UPDATE UserToken SET used_at = NOW() WHERE user_id = ? AND token = ?",
      [userId, otp]
    );

    return NextResponse.json({ resetToken: otpData.token }, { status: 200 });

  } catch (error) {
    console.error("Error verifying password OTP:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
