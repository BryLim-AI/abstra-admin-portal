import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

interface BillCountResult extends RowDataPacket {
  bill_count: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unit_id = searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
  }

  try {
    const [rows] = await db.query<BillCountResult[]>(
      `SELECT COUNT(*) AS bill_count
       FROM Billing
       WHERE unit_id = ?
         AND DATE_FORMAT(billing_period, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
      [unit_id]
    );

    const hasBillForThisMonth = rows[0]?.bill_count > 0;

    return NextResponse.json({ unit_id, hasBillForThisMonth });
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ error: "Database server error" }, { status: 500 });
  }
}
