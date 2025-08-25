import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows]: any = await db.query(
      `SELECT user_id, firstName, lastName, email, phoneNumber, userType, createdAt, updatedAt
       FROM User 
       WHERE status = 'deactivated'`
    );

    const decryptedRows = rows.map((row: any) => ({
      ...row,
      email: decryptData(JSON.parse(row.email), process.env.ENCRYPTION_SECRET!),
      firstName: decryptData(JSON.parse(row.firstName), process.env.ENCRYPTION_SECRET!),
      lastName: decryptData(JSON.parse(row.lastName), process.env.ENCRYPTION_SECRET!),
    }));

    return NextResponse.json(decryptedRows, { status: 200 });
  } catch (error) {
    console.error("Database Server Error:", error);
    return NextResponse.json(
      { message: `Database Server Error: ${error}` },
      { status: 500 }
    );
  }
}
