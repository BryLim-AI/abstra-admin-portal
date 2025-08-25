import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

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
    const [rows] = await db.execute<RowDataPacket[]>(
      `
      SELECT 
        COUNT(CASE WHEN U.status = 'occupied' THEN 1 END) AS occupied_units,
        COUNT(U.unit_id) AS total_units,
        (COUNT(CASE WHEN U.status = 'occupied' THEN 1 END) / COUNT(U.unit_id)) * 100 AS occupancy_rate
      FROM Unit U
      JOIN Property P ON U.property_id = P.property_id
      WHERE P.landlord_id = ?
      `,
      [landlord_id]
    );

    return NextResponse.json({ occupancyRate: rows[0] });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
