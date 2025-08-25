import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { decryptData } from "@/crypto/encrypt"; // adjust import path as needed

export async function POST(req: NextRequest) {
    try {
        const { user_id } = await req.json();

        if (!user_id) {
            return new Response(JSON.stringify({ error: "Missing user_id." }), {
                status: 400,
            });
        }

        const [users]: any[] = await db.execute(
            "SELECT email FROM User WHERE user_id = ?",
            [user_id]
        );

        if (!users || users.length === 0) {
            return new Response(JSON.stringify({ error: "User not found." }), {
                status: 404,
            });
        }

        let email = users[0].email;

        try {
            email = await decryptData(JSON.parse(email), process.env.ENCRYPTION_SECRET!);
        } catch (error) {
            console.error("[Resend OTP] Decryption failed for email.");
            return new Response(
                JSON.stringify({ error: "Failed to decrypt user email." }),
                { status: 500 }
            );
        }

        const newOtp = crypto.randomInt(100000, 999999).toString();

        await db.execute(
            `UPDATE UserToken 
       SET token = ?, 
           created_at = CONVERT_TZ(NOW(), 'SYSTEM', 'Asia/Manila'), 
           expires_at = CONVERT_TZ(DATE_ADD(NOW(), INTERVAL 10 MINUTE), 'SYSTEM', 'Asia/Manila') 
       WHERE user_id = ? AND token_type = '2fa'`,
            [newOtp, user_id]
        );

        await sendOtpEmail(email, newOtp);

        return new Response(JSON.stringify({ message: "OTP resent successfully." }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error during resend2faOtp:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
        });
    }
}

async function sendOtpEmail(email: string, otp: string) {
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

    return transporter.sendMail(mailOptions);
}
