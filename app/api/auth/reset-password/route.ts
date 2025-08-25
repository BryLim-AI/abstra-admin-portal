import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { resetToken, newPassword } = await req.json();

    if (!resetToken || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: "Invalid request data." }, { status: 400 });
    }

    const [tokens]: any[] = await db.query(
      `SELECT user_id FROM UserToken 
       WHERE token = ? AND token_type = 'password_reset' AND expires_at > NOW()`,
      [resetToken]
    );

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ message: "Invalid or expired reset token." }, { status: 400 });
    }

    const userId = tokens[0].user_id;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE User SET password = ? WHERE user_id = ?",
      [hashedPassword, userId]
    );

    await db.query(
      "DELETE FROM UserToken WHERE user_id = ? AND token_type = 'password_reset'",
      [userId]
    );

    return NextResponse.json({ message: "Password reset successfully." }, { status: 200 });

  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ message: "An error occurred. Please try again later." }, { status: 500 });
  }
}
