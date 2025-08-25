import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const { unitId, status } = await req.json();

    if (!status || !["occupied", "unoccupied"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    if (!unitId) {
      return NextResponse.json({ message: "Unit ID is required" }, { status: 400 });
    }

    const [result]: any = await db.query(
      "UPDATE Unit SET status = ?, updated_at = NOW() WHERE unit_id = ?",
      [status, unitId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: "Unit not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Status updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
