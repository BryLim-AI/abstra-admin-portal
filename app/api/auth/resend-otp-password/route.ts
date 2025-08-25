import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
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

    // Clean up old OTP
    await db.query(
      "DELETE FROM UserToken WHERE user_id = ? AND token_type = 'password_reset'",
      [userId]
    );

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // +10 mins

    const nowUTC8 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const expiresAtUTC8 = new Date(expiresAt.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    await db.query("SET time_zone = '+08:00'");

    await db.query(
      `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
       VALUES (?, 'password_reset', ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         token = VALUES(token), 
         created_at = VALUES(created_at), 
         expires_at = VALUES(expires_at)`,
      [userId, newOtp, nowUTC8, expiresAtUTC8]
    );

    await sendOtpEmail(email, newOtp);

    return NextResponse.json(
      { message: "New OTP has been sent to your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resending OTP:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function sendOtpEmail(toEmail: string, newOtp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER!,
    to: toEmail,
    subject: "Hestia: Reset Password OTP",
    text: `Your OTP is: ${newOtp}`,
  });

  console.log(`[Email] Password reset OTP sent to ${toEmail}`);
}
