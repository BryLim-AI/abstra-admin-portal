import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const unitId = req.nextUrl.searchParams.get("unitId");

  if (!unitId) {
    return NextResponse.json(
      { message: "Missing required parameter: unitId" },
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.query("SELECT status FROM Unit WHERE unit_id = ?", [
      unitId,
    ]);

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ message: "Unit not found" }, { status: 404 });
    }

    const unitStatus = (rows as any[])[0].status;

    return NextResponse.json({ status: unitStatus }, { status: 200 });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
