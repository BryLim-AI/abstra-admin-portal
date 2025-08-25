import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";
import { SignJWT } from "jose";
import nodemailer from "nodemailer";
import { db } from "@/lib/db"; // Adjust to your path

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "Authorization code is required" }, { status: 400 });
    }

    try {
        const {
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI_SIGNIN,
            JWT_SECRET,
        } = process.env;


        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: REDIRECT_URI_SIGNIN!,
                grant_type: "authorization_code",
            }).toString(),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );

        const { access_token } = tokenResponse.data;

        const userInfoResponse = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: { Authorization: `Bearer ${access_token}` },
            }
        );

        const user = userInfoResponse.data;

        const emailHash = crypto
            .createHash("sha256")
            .update(user.email.trim().toLowerCase())
            .digest("hex");

        const [rows]: any = await db.execute(
            "SELECT user_id, email, userType, is_2fa_enabled, google_id, status FROM User WHERE emailHashed = ?",
            [emailHash]
        );

        if (rows.length === 0 || !rows[0].email || !rows[0].google_id) {
            console.error("[Google OAuth] User not found or not linked with Google.");
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_BASE_URL}/pages/auth/login?error=${encodeURIComponent("User not registered with Google. Use email and password to sign in")}`
            );
        }

        if (rows[0].status === "deactivated") {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_BASE_URL}/pages/auth/login?error=${encodeURIComponent("Your Account is DEACTIVATED. Contact Support.")}`
            );
        }

        if (rows[0].status === "suspended") {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_BASE_URL}/pages/auth/login?error=${encodeURIComponent("User Account SUSPENDED. Please Contact Support.")}`
            );
        }

        const dbUser = rows[0];

        if (dbUser.is_2fa_enabled) {
            const otp = Math.floor(100000 + Math.random() * 900000);

            await db.execute(
                `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
         VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
         ON DUPLICATE KEY UPDATE
           token = VALUES(token),
           created_at = NOW(),
           expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`,
                [dbUser.user_id, otp]
            );

            await sendOtpEmail(dbUser.email, otp);

            const pending2fa = NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_BASE_URL}/pages/auth/verify-2fa?user_id=${dbUser.user_id}`
            );
            pending2fa.cookies.set("pending_2fa", "true", {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
            });
            return pending2fa;
        }

        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({
            user_id: dbUser.user_id,
            email: dbUser.email,
            userType: dbUser.userType,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .setIssuedAt()
            .setSubject(dbUser.user_id.toString())
            .sign(secret);

        const response = NextResponse.redirect(
            dbUser.userType === "tenant"
                ? `${process.env.NEXT_PUBLIC_BASE_URL}/pages/tenant/my-unit`
                : `${process.env.NEXT_PUBLIC_BASE_URL}/pages/landlord/dashboard`
        );

        response.cookies.set("token", token, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
        });

        return response;
    } catch (error: any) {
        console.error("[Google OAuth] Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
    }
}

async function sendOtpEmail(email: string, otp: number) {
    if (!email) {
        console.error("[Google OAuth] Missing email for OTP.");
        throw new Error("Missing email for OTP delivery.");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Hestia 2FA OTP Code",
        text: `Your OTP Code is: ${otp}\nThis code will expire in 10 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Google OAuth] OTP sent to ${email}`);
    } catch (error) {
        console.error("[Google OAuth] Error sending OTP:", error);
        throw new Error("Failed to send OTP email.");
    }
}
