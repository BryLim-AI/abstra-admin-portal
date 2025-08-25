import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
    }

    try {
        const [unitRows] = await db.execute(
            "SELECT unit_id FROM LeaseAgreement WHERE agreement_id = ? LIMIT 1",
            [agreement_id]
        );

        // @ts-ignore
        if (!unitRows.length) {
            return NextResponse.json({ error: "No unit found for this agreement" }, { status: 404 });
        }

        // @ts-ignore
        const unit_id = unitRows[0].unit_id;

        // 2. Sum unpaid bills for the unit
        const [billingRows] = await db.execute(
            `
      SELECT 
        IFNULL(SUM(total_amount_due), 0) AS total_due,
        IFNULL(SUM(CASE WHEN status='paid' THEN total_amount_due ELSE 0 END), 0) AS paid_amount
      FROM Billing
      WHERE unit_id = ?;
      `,
            [unit_id]
        );

        // @ts-ignore
        const billing = billingRows[0];

        return NextResponse.json({ billing });
    } catch (err) {
        console.error("Error fetching payment due:", err);
        return NextResponse.json({ error: "Failed to fetch payment due" }, { status: 500 });
    }
}
