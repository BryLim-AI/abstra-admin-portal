import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { decryptData } from '@/crypto/encrypt';

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 [Resend OTP] Request received.");

    const token = (await cookies()).get('token')?.value;

    if (!token) {
      console.error("[Resend OTP] No valid token found.");
      return NextResponse.json({ error: "Unauthorized. No valid session token found." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    let payload;

    try {
      const verifiedToken = await jwtVerify(token, secret);
      payload = verifiedToken.payload;
    } catch (err) {
      console.error("[Resend OTP] Invalid JWT token.");
      return NextResponse.json({ error: "Invalid token. Please log in again." }, { status: 401 });
    }

    const user_id = payload?.user_id;
    if (!user_id) {
      console.error("[Resend OTP] Invalid JWT payload.");
      return NextResponse.json({ error: "Invalid session data." }, { status: 400 });
    }

    console.log(`[Resend OTP] User verified: ${user_id}`);

    const [user] = await db.execute<any[]>(
      "SELECT email FROM User WHERE user_id = ?",
      [user_id]
    );

    if (!user || user.length === 0) {
      console.error("[Resend OTP] User email not found.");
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let email = user[0].email;

    try {
      email = await decryptData(JSON.parse(email), process.env.ENCRYPTION_SECRET!);
      console.log("🔓 [Resend OTP] Decrypted Email:", email);
    } catch (err) {
      console.warn("⚠ [Resend OTP] Email decryption failed, using stored value.", err);
      return NextResponse.json({ error: "Email decryption failed. Please contact support." }, { status: 500 });
    }

    const newOtp = crypto.randomInt(100000, 999999).toString();
    console.log(`[Resend OTP] New OTP: ${newOtp}`);

    await db.execute(
      `
      INSERT INTO UserToken (user_id, token_type, token, expires_at)
      VALUES (?, 'email_verification', ?, NOW() + INTERVAL 10 MINUTE)
      ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = NOW() + INTERVAL 10 MINUTE
    `,
      [user_id, newOtp]
    );

    console.log(`[Resend OTP] OTP stored in database for user: ${user_id}`);

    await sendOtpEmail(email, newOtp);
    console.log(`[Resend OTP] OTP ${newOtp} sent to ${email}`);

    return NextResponse.json({ message: "New OTP sent. Check your email." });

  } catch (error) {
    console.error("[Resend OTP] Error:", error);
    return NextResponse.json({ error: "Failed to resend OTP. Please try again." }, { status: 500 });
  }
}

async function sendOtpEmail(toEmail: string, otp: string) {
  try {
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
      subject: "Hestia Registration: Your New OTP",
      text: `Your new OTP is: ${otp}. It expires in 10 minutes.`,
    });

    console.log(`[Email] OTP sent to ${toEmail}`);
  } catch (error) {
    console.error("[Email] Failed to send OTP:", error);
  }
}
