import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const [landlords]: any = await db.query(`
      SELECT l.*, u.email AS user_email
      FROM Landlord l
      JOIN User u ON l.user_id = u.user_id
      WHERE u.status = 'active'
    `);

    const decryptedLandlords = landlords.map((landlord: any) => {
      let decryptedEmail = landlord.user_email;

      try {
        if (landlord.user_email) {
          decryptedEmail = decryptData(
            JSON.parse(landlord.user_email),
            process.env.ENCRYPTION_SECRET!
          );
        }
      } catch (err) {
        console.error(
          `Failed to decrypt email for landlord id ${landlord.id}:`,
          err
        );
      }

      return {
        ...landlord,
        email: decryptedEmail,
      };
    });

    return NextResponse.json({ landlords: decryptedLandlords }, { status: 200 });
  } catch (error) {
    console.error("Error fetching landlords:", error);
    return NextResponse.json(
      { success: false, message: "DB Server Error" },
      { status: 500 }
    );
  }
}
