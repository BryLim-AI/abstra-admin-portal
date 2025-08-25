import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  try {
    const emailHash = crypto.createHash("sha256").update(email).digest("hex");
    const [users]: any[] = await db.query(
      "SELECT user_id, email, google_id FROM User WHERE emailHashed = ?",
      [emailHash]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const user = users[0];

    if (user.google_id) {
      return NextResponse.json(
        {
          error: "Your account is linked with Google. Please log in using your Google Account.",
        },
        { status: 403 }
      );
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    // const nowUTC8 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    // const expiresAtUTC8 = new Date(expiresAt.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    await db.query("SET time_zone = '+08:00'");

    await db.query(
      `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
       VALUES (?, 'password_reset', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
       ON DUPLICATE KEY UPDATE
         token = VALUES(token),
         created_at = NOW(),
         expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`,
      [user.user_id, otp]
    );

    await sendOtpEmail(email, otp);

    return NextResponse.json({ message: "OTP sent to your email." }, { status: 200 });
  } catch (error) {
    console.error("Error during forgot password process:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

async function sendOtpEmail(toEmail: string, otp: string) {
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
    text: `Your OTP is: ${otp}`,
  });

  console.log(`[Email] Sent password reset OTP to ${toEmail}`);
}
