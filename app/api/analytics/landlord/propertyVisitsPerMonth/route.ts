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
      SELECT
        MONTH(visit_date) AS month,
        COUNT(*) AS visitCount
      FROM PropertyVisit
      JOIN Unit ON PropertyVisit.unit_id = Unit.unit_id
      JOIN Property ON Unit.property_id = Property.property_id
      WHERE Property.landlord_id = ?
      GROUP BY MONTH(visit_date)
      ORDER BY MONTH(visit_date)
      `,
      [landlord_id]
    );

    return NextResponse.json({ visitsPerMonth: rows });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
