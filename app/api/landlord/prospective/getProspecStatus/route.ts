import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const unit_id = searchParams.get("unit_id");
  const tenant_id = searchParams.get("tenant_id");

  if (!unit_id) {
    return NextResponse.json(
      { message: "Unit ID is required" },
      { status: 400 }
    );
  }

  try {
    const query = `
      SELECT status 
      FROM ProspectiveTenant 
      WHERE unit_id = ? AND tenant_id = ?
      ORDER BY updated_at DESC
    `;

    const [rows] = await db.query(query, [unit_id, tenant_id]);

    // @ts-ignore
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No prospective tenant found" },
        { status: 404 }
      );
    }

    // @ts-ignore
    return NextResponse.json({ status: rows[0].status }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching prospective tenant status:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
