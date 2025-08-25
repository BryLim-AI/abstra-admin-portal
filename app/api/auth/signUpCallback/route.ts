import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import axios from "axios";
import crypto from "crypto";
import { SignJWT } from "jose";
import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const body = await req.json().catch(() => ({}));
    const dob = body.dob;
    const mobileNumber = body.mobileNumber;

    if (!code || !state) {
        return NextResponse.json({ error: "Code and state are required" }, { status: 400 });
    }

    try {
        const {
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI,
            JWT_SECRET,
            ENCRYPTION_SECRET,
        } = process.env;

        const { userType } = JSON.parse(decodeURIComponent(state)) || {};
        const finalUserType = userType ? userType.trim().toLowerCase() : "tenant";

        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: REDIRECT_URI!,
                grant_type: "authorization_code",
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token } = tokenResponse.data;

        const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const user = userInfoResponse.data;

        const googleId = user.sub || null;
        const firstName = user.given_name || "Unknown";
        const lastName = user.family_name || "Unknown";
        const email = user.email ? user.email.trim().toLowerCase() : null;
        const phoneNumber = mobileNumber ? mobileNumber.trim() : null;
        const birthDate = dob ? dob.trim() : null;
        const profilePicture = user?.picture;

        if (!googleId) {
            throw new Error("Google OAuth failed: Missing google_id (sub).");
        }

        const emailHash = email
            ? crypto.createHash("sha256").update(email).digest("hex")
            : null;
        const emailEncrypted = email ? JSON.stringify(await encryptData(email, ENCRYPTION_SECRET!)) : null;
        const fnameEncrypted = firstName ? JSON.stringify(await encryptData(firstName, ENCRYPTION_SECRET!)) : null;
        const lnameEncrypted = lastName ? JSON.stringify(await encryptData(lastName, ENCRYPTION_SECRET!)) : null;
        const phoneEncrypted = phoneNumber ? JSON.stringify(await encryptData(phoneNumber, ENCRYPTION_SECRET!)) : null;
        const photoEncrypted = profilePicture ? JSON.stringify(await encryptData(profilePicture, ENCRYPTION_SECRET!)) : null;
        const birthDateEncrypted = birthDate ? JSON.stringify(await encryptData(birthDate, ENCRYPTION_SECRET!)) : null;

        const [existingUsers]: any = await db.execute(
            "SELECT * FROM User WHERE emailHashed = ? OR google_id = ?",
            [emailHash, googleId]
        );

        if (existingUsers.length > 0) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_BASE_URL}/pages/auth/register?error=${encodeURIComponent(
                    "User already registered with Google. Signin instead."
                )}`
            );
        }

        let userId: string;
        let dbUser: any;

        if (existingUsers.length === 0) {
            await db.execute(
                `INSERT INTO User (user_id, firstName, lastName, email, emailHashed, password, birthDate, phoneNumber, userType, createdAt, updatedAt, google_id, emailVerified, profilePicture, status)
                 VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?)`,
                [
                    fnameEncrypted || null,
                    lnameEncrypted || null,
                    emailEncrypted || null,
                    emailHash || null,
                    " ",
                    birthDateEncrypted || null,
                    phoneEncrypted || 0,
                    finalUserType || "tenant",
                    googleId || null,
                    0,
                    photoEncrypted,
                    "active",
                ]
            );

            const [user] = await db.execute(`SELECT user_id FROM User WHERE emailHashed = ?`, [
                emailHash,
            ]);
            // @ts-ignore
            if (!user || user.length === 0) {
                throw new Error("Failed to retrieve userID after User creation");
            }

            // @ts-ignore
            userId = user[0].user_id;

            if (finalUserType === "tenant") {
                await db.execute(`INSERT INTO Tenant (user_id) VALUES (?)`, [userId]);
            } else if (finalUserType === "landlord") {
                await db.execute(`INSERT INTO Landlord (user_id) VALUES (?)`, [userId]);
            }

            await db.execute(
                `INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())`,
                [userId, "User registered"]
            );

            dbUser = {
                user_id: userId,
                username: `${firstName} ${lastName}`,
                // @ts-ignore
                email: user.email,
                userType: finalUserType,
            };
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        await db.query(
            `INSERT INTO UserToken (user_id, token_type, token, expires_at)
             VALUES (?, 'email_verification', ?, NOW() + INTERVAL 10 MINUTE)`,
            // @ts-ignore
            [userId, otp]
        );
        await sendOtpEmail(user.email, otp);

        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({
            user_id: dbUser.user_id,
            username: dbUser.username,
            userType: dbUser.userType,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .setIssuedAt()
            // @ts-ignore
            .setSubject(userId.toString())
            .sign(secret);

        const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/pages/auth/verify-email`);
        response.cookies.set("token", token, {
            httpOnly: true,
            sameSite: "strict",
            path: "/",
            secure: process.env.NODE_ENV === "production",
        });

        return response;
    } catch (error: any) {
        console.error("Error during Google OAuth:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
    }
}

async function sendOtpEmail(toEmail: string, otp: string) {
    try {
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

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: "Email Verification OTP",
            text: `Your OTP for email verification is: ${otp}. This OTP is valid for 10 minutes.`,
        });

        console.log(`OTP sent to ${toEmail}`);
    } catch (error) {
        console.error("Failed to send OTP email:", error);
    }
}
