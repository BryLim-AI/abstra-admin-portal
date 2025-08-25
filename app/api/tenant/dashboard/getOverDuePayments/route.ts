import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // your MySQL connection

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
    }

    try {
        const [rows] = await db.execute<{
            total_overdue: number;
            overdue_count: number;
        }[]>(
            `
      SELECT 
          IFNULL(SUM(b.total_amount_due), 0) AS total_overdue,
          COUNT(*) AS overdue_count
      FROM Billing b
      JOIN Unit u ON u.unit_id = b.unit_id
      JOIN LeaseAgreement l ON l.unit_id = u.unit_id
      WHERE l.agreement_id = ? AND b.status = 'overdue'
      `,
            [agreement_id]
        );

        const result = rows[0] || { total_overdue: 0, overdue_count: 0 };

        return NextResponse.json({ overdue: result });
    } catch (err: any) {
        console.error("Failed to fetch overdue payments:", err);
        return NextResponse.json(
            { error: "Failed to fetch overdue payments" },
            { status: 500 }
        );
    }
}
