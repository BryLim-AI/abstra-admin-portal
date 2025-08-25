import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { RowDataPacket } from "mysql2";

export async function GET(req:NextRequest) {
  const { searchParams } = new URL(req.url);
  const unit_id = searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json({ error: "Missing unit_id" }, { status: 400 });
  }

  try {
    const [unitResult] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM Unit WHERE unit_id = ?`,
      [unit_id]
    );

    if (unitResult.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const unit = unitResult[0];

    const [propertyResult] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM Property WHERE property_id = ?`,
      [unit.property_id]
    );

    const property = propertyResult.length > 0 ? propertyResult[0] : null;

    return NextResponse.json({ unit, property }, { status: 200 });
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ error: "DB Server Error" }, { status: 500 });
  }
}
