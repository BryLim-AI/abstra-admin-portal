import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { userId, message, email } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId." },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      "UPDATE User SET status = ? WHERE user_id = ?",
      ["suspended", userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await sendSuspensionEmail(email, message);

    return NextResponse.json(
      { message: "Account suspended successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling suspend account request:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}

async function sendSuspensionEmail(toEmail: string, message: string) {
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
    subject: "Account Suspended",
    text: `Your account is: ${message}.`,
  });

  console.log(`Suspension email sent to ${toEmail}`);
}
