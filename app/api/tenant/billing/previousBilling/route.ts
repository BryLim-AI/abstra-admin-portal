import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let agreementId = searchParams.get("agreement_id");
    const userId = searchParams.get("user_id");

    try {
        if (!agreementId && userId) {
            const [agreements] = await db.query(
                `SELECT agreement_id FROM LeaseAgreement WHERE tenant_id = ? ORDER BY start_date DESC LIMIT 1`,
                [userId]
            );
            // @ts-ignore
            if (!agreements.length) {
                return NextResponse.json({ message: "No lease agreement found for user." }, { status: 404 });
            }
            // @ts-ignore
            agreementId = agreements[0].agreement_id;
        }

        if (!agreementId) {
            return NextResponse.json({ message: "Agreement ID or User ID is required" }, { status: 400 });
        }

        // Get unit_id from LeaseAgreement
        const [leaseRows] = await db.query(
            `SELECT unit_id FROM LeaseAgreement WHERE agreement_id = ?`,
            [agreementId]
        );
        // @ts-ignore
        if (!leaseRows.length) {
            return NextResponse.json({ message: "Lease agreement not found" }, { status: 404 });
        }
        // @ts-ignore
        const unitId = leaseRows[0].unit_id;

        // Get all previous billings (exclude current month)
        const [billingRows] = await db.query(
            `SELECT billing_id, billing_period 
       FROM Billing 
       WHERE unit_id = ? 
         AND (YEAR(billing_period) < YEAR(CURRENT_DATE()) 
           OR (YEAR(billing_period) = YEAR(CURRENT_DATE()) AND MONTH(billing_period) < MONTH(CURRENT_DATE())))
       ORDER BY billing_period DESC`,
            [unitId]
        );

        return NextResponse.json(
            {
                billings: billingRows,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Previous billing route error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
