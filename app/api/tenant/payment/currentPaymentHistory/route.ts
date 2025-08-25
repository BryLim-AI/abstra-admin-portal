import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreementId = searchParams.get("agreement_id");

    if (!agreementId) {
        return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
    }

    try {
        // Fetch lease agreement details
        const [leaseResult] = await db.execute(
            `SELECT agreement_id, tenant_id, unit_id
       FROM LeaseAgreement
       WHERE agreement_id = ? AND status = 'active'
       LIMIT 1`,
            [agreementId]
        );

        // @ts-ignore
        const lease = leaseResult[0];

        if (!lease) {
            return NextResponse.json({ error: "No active lease found for this agreement" }, { status: 404 });
        }

        // Fetch payments
        const [paymentResult] = await db.execute(
            `SELECT p.payment_id, p.agreement_id, p.payment_type, p.amount_paid,
              p.payment_status, p.receipt_reference, p.payment_date,
              pm.method_name AS payment_method
       FROM Payment p
       JOIN PaymentMethod pm ON p.payment_method_id = pm.method_id
       WHERE p.agreement_id = ?
       ORDER BY p.payment_date DESC`,
            [agreementId]
        );

        // @ts-ignore
        if (paymentResult.length === 0) {
            return NextResponse.json({ message: "No payments found for the active lease" }, { status: 404 });
        }

        return NextResponse.json({
            leaseAgreement: lease,
            payments: paymentResult
        });

    } catch (error) {
        return NextResponse.json({ error: `Database Error: ${error}` }, { status: 500 });
    }
}
