import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import nodeCrypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, captchaToken, rememberMe } = body;

  if (!email || !password || !captchaToken) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const captchaSecret = process.env.RECAPTCHA_SECRET_KEY!;
  const verifyCaptchaURL = "https://www.google.com/recaptcha/api/siteverify";

  const params = new URLSearchParams();
  params.append("secret", captchaSecret);
  params.append("response", captchaToken);

  try {
    // ✅ Verify CAPTCHA
    const captchaRes = await fetch(verifyCaptchaURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const captchaData = await captchaRes.json();
    if (!captchaData.success) {
      return NextResponse.json(
          { error: "CAPTCHA verification failed. Please try again." },
          { status: 403 }
      );
    }

    // ✅ Lookup user
    const emailHash = nodeCrypto.createHash("sha256").update(email).digest("hex");
    const [users]: any[] = await db.query("SELECT * FROM User WHERE emailHashed = ?", [emailHash]);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = users[0];

    // ✅ Account checks
    if (user.google_id) {
      return NextResponse.json({
        error: "Your account is linked with Google Sign-In. Please log in using Google.",
      }, { status: 403 });
    }

    if (user.status === "deactivated") {
      return NextResponse.json({
        error: "Your account is deactivated since you requested deletion. Please contact support if this was a mistake.",
      }, { status: 403 });
    }

    if (user.status === "suspended") {
      return NextResponse.json({
        error: "Your account is suspended. Please contact support.",
      }, { status: 403 });
    }

    // ✅ Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Decrypt names
    const firstName = await decryptData(JSON.parse(user.firstName), process.env.ENCRYPTION_SECRET!);
    const lastName = await decryptData(JSON.parse(user.lastName), process.env.ENCRYPTION_SECRET!);

    // ✅ JWT expiration time based on rememberMe
    const jwtExpiry = rememberMe ? "7d" : "2h";
    const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 7 : undefined; // cookie persistence

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({
      user_id: user.user_id,
      userType: user.userType,
      firstName,
      lastName,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(jwtExpiry)
        .setIssuedAt()
        .setSubject(user.user_id)
        .sign(secret);

    const response = NextResponse.json(
        {
          message: "Login successful",
          token,
          user: {
            userID: user.user_id,
            firstName,
            lastName,
            email,
            userType: user.userType,
          },
        },
        { status: 200 }
    );

    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isProd,
      path: "/",
      sameSite: "lax",
      ...(cookieMaxAge ? { maxAge: cookieMaxAge } : {}), // persistent if rememberMe
    });

    // ✅ Handle 2FA
    if (user.is_2fa_enabled) {
      const otp = Math.floor(100000 + Math.random() * 900000);

      await db.query("SET time_zone = '+08:00'");
      await db.query(
          `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
         VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
         ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`,
          [user.user_id, otp]
      );

      await sendOtpEmail(email, otp.toString());
      response.cookies.set("pending_2fa", "true", { httpOnly: true, path: "/" });

      return NextResponse.json({
        message: "OTP sent. Please verify to continue.",
        requires_otp: true,
        user_id: user.user_id,
        userType: user.userType,
      }, { status: 200 });
    }

    // ✅ Activity log
    const action = "User logged in";
    const timestamp = new Date().toISOString();
    await db.query(
        "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, ?)",
        [user.user_id, action, timestamp]
    );

    return response;
  } catch (error: any) {
    console.error("Error during signin:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendOtpEmail(email: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER!,
    to: email,
    subject: "Your Hestia 2FA OTP Code",
    text: `Your OTP Code is: ${otp}\nThis code will expire in 10 minutes.`,
  });

  console.log(`OTP sent to ${email}`);
}
