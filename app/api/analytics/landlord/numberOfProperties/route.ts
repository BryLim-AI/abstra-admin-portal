import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const landlord_id = searchParams.get("landlord_id");

  if (!landlord_id) {
    return NextResponse.json(
      { error: "Missing landlord_id parameter" },
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.execute(
      `
      SELECT property_type, COUNT(*) AS count
      FROM Property
      WHERE landlord_id = ?
      GROUP BY property_type
      `,
      [landlord_id]
    );

return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch property type breakdown: " + error.message },
      { status: 500 }
    );
  }
}
