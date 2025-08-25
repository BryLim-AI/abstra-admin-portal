import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; action: "approve" | "reject" } }
) {
    const { id, action } = params;
    const paymentId = parseInt(id);

    if (!paymentId || isNaN(paymentId)) {
        return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
    }

    const validActions = {
        approve: "confirmed",
        reject: "failed",
    } as const;

    const newStatus = validActions[action];
    if (!newStatus) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    try {
        // 1. Update payment status
        await db.query(
            `UPDATE Payment SET payment_status = ? WHERE payment_id = ?`,
            [newStatus, paymentId]
        );

        // 2. If approved and initial_payment, update LeaseAgreement flags
        if (action === "approve") {
            const [paymentRows]: any = await db.query(
                `SELECT agreement_id, payment_type FROM Payment WHERE payment_id = ?`,
                [paymentId]
            );

            const payment = paymentRows?.[0];
            if (payment && payment.payment_type === "initial_payment") {
                await db.query(
                    `
            UPDATE LeaseAgreement 
            SET 
              is_security_deposit_paid = 1,
              is_advance_payment_paid = 1
            WHERE agreement_id = ?
          `,
                    [payment.agreement_id]
                );
            }
        }

        return NextResponse.json({ message: `Payment ${action}d successfully.` });
    } catch (err: any) {
        console.error("Payment update failed:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
