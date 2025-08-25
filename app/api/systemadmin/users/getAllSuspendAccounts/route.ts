import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const [rows]: any = await db.query(
      `SELECT user_id, firstName, lastName, email, phoneNumber, userType, createdAt, updatedAt
       FROM User 
       WHERE status = 'suspended'`
    );

    const result = rows.map((user: any) => {
      let email = user.email;
      let firstName = user.firstName;
      let lastName = user.lastName;

      try {
        email = decryptData(JSON.parse(user.email), process.env.ENCRYPTION_SECRET!);
        firstName = decryptData(JSON.parse(user.firstName), process.env.ENCRYPTION_SECRET!);
        lastName = decryptData(JSON.parse(user.lastName), process.env.ENCRYPTION_SECRET!);
      } catch (err) {
        console.error(`Error decrypting fields for user ${user.user_id}:`, err);
      }

      return {
        ...user,
        email,
        firstName,
        lastName,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Database Server Error:", error);
    return NextResponse.json(
      { message: `Database Server Error`, error: error },
      { status: 500 }
    );
  }
}
