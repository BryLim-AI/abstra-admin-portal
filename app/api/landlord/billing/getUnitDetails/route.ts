import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const property_id = searchParams.get("property_id");

  if (!property_id) {
    return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
  }

  try {
    const [units] = await db.execute(
      `SELECT * FROM Unit WHERE property_id = ?`,
      [property_id]
    );

    return NextResponse.json(units);
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ error: "DB Server Error" }, { status: 500 });
  }
}
