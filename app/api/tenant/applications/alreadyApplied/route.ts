import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant_id = searchParams.get("tenant_id");
  const unit_id = searchParams.get("unit_id");

  if (!tenant_id || !unit_id) {
    return NextResponse.json({ message: "Missing tenant_id or unit_id" }, { status: 400 });
  }

  try {
    const [rows] = await db.query(
      "SELECT id FROM ProspectiveTenant WHERE tenant_id = ? AND unit_id = ?",
      [tenant_id, unit_id]
    );
// @ts-ignore
    return NextResponse.json({ hasApplied: rows.length > 0 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
