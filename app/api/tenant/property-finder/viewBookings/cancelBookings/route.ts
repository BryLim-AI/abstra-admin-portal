import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { visit_id } = body;

    if (!visit_id) {
      return NextResponse.json({ message: "Visit ID is required" }, { status: 400 });
    }

    await db.query(
      `UPDATE PropertyVisit SET status = 'cancelled' WHERE visit_id = ?`,
      [visit_id]
    );

    return NextResponse.json({ message: "Visit cancelled successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error cancelling visit:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
