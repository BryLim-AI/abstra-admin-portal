import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { tenant_id, unit_id, visit_date, visit_time } = await req.json();

    if (!tenant_id || !unit_id || !visit_date || !visit_time) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    await db.query(
      "INSERT INTO PropertyVisit (tenant_id, unit_id, visit_date, visit_time) VALUES (?, ?, ?, ?)",
      [tenant_id, unit_id, visit_date, visit_time]
    );

    return NextResponse.json({ message: "Visit scheduled successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error scheduling visit:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
