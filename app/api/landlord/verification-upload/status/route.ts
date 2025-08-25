import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");

  if (!user_id) {
    return NextResponse.json({ message: "Missing user_id" }, { status: 400 });
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  });

  try {
    // Get landlord_id first
    const [landlordRows]: any = await db.execute(
        `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
        [user_id]
    );

    if (landlordRows.length === 0) {
      await db.end();
      return NextResponse.json({ message: "Landlord not found" }, { status: 404 });
    }

    const { landlord_id } = landlordRows[0];

    // Get latest verification status from LandlordVerification
    const [verificationRows]: any = await db.execute(
        `SELECT status 
       FROM LandlordVerification 
       WHERE landlord_id = ? 
       ORDER BY updated_at DESC 
       LIMIT 1`,
        [landlord_id]
    );

    let verificationStatus = "not verified"; // default if no records
    if (verificationRows.length > 0) {
      verificationStatus = verificationRows[0].status;
    }

    await db.end();
    return NextResponse.json({ verification_status: verificationStatus }, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    await db.end();
    return NextResponse.json({ message: "Database Server Error" }, { status: 500 });
  }
}
