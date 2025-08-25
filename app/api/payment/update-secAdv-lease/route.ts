import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        agreement_id,
        requestReferenceNumber,
        totalAmount,
    } = body;

    console.log("API received:", body);

    if (!agreement_id || !requestReferenceNumber || !totalAmount) {
        return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    const dbHost = process.env.DB_HOST!;
    const dbUser = process.env.DB_USER!;
    const dbPassword = process.env.DB_PASSWORD!;
    const dbName = process.env.DB_NAME!;

    let connection;

    try {
        connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
        });

        await connection.beginTransaction();

        // Check if payment already exists
        const [existingPayments] = await connection.execute(
            `SELECT payment_id FROM Payment WHERE receipt_reference = ? AND payment_status = 'confirmed'`,
            [requestReferenceNumber]
        );

        if (Array.isArray(existingPayments) && existingPayments.length > 0) {
            const [alreadyConfirmedDetails] = await connection.execute(
                `SELECT payment_type, amount_paid FROM Payment WHERE receipt_reference = ? AND payment_status = 'confirmed'`,
                [requestReferenceNumber]
            );

            // @ts-ignore
            const confirmedItems = alreadyConfirmedDetails.map((p: any) => p.payment_type);
            // @ts-ignore
            const totalConfirmed = alreadyConfirmedDetails.reduce(
                (sum: number, p: any) => sum + parseFloat(p.amount_paid || 0),
                0
            );

            return NextResponse.json({
                message: `Payment already recorded for reference: ${requestReferenceNumber}.`,
                processed: true,
                requestReferenceNumber,
                confirmedItems,
                totalAmountConfirmed: totalConfirmed.toFixed(2),
            });
        }

        // Fetch lease info
        const [leaseDetails] = await connection.execute(
            `SELECT la.is_security_deposit_paid, la.is_advance_payment_paid
             FROM LeaseAgreement la
             WHERE la.agreement_id = ?`,
            [agreement_id]
        );

        if (!Array.isArray(leaseDetails) || leaseDetails.length === 0) {
            throw new Error(`Could not find lease agreement for ID: ${agreement_id}`);
        }

        const lease = leaseDetails[0] as any;

        const alreadySecPaid = !!lease.is_security_deposit_paid;
        const alreadyAdvPaid = !!lease.is_advance_payment_paid;

        if (alreadySecPaid && alreadyAdvPaid) {
            return NextResponse.json({
                message: "Both security deposit and advance rent already marked as paid.",
                processed: false,
                requestReferenceNumber,
                confirmedItems: [],
                totalAmountConfirmed: "0.00",
            });
        }

        // Insert single payment record
        const insertPaymentSql = `
            INSERT INTO Payment
            (agreement_id, payment_type, amount_paid, payment_method_id, payment_status,
             receipt_reference, payment_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`;

        await connection.execute(insertPaymentSql, [
            agreement_id,
            "sec_and_adv", // or "initial_payment" to hange
            totalAmount,
            7, //for maya
            "confirmed",
            requestReferenceNumber,
        ]);

        // Update lease flags
        const updateLeaseSql = `
            UPDATE LeaseAgreement
            SET is_security_deposit_paid = 1,
                is_advance_payment_paid = 1,
                updated_at = NOW()
            WHERE agreement_id = ?`;

        const [updateResult] = await connection.execute(updateLeaseSql, [agreement_id]);
        const leaseUpdated = (updateResult as any).affectedRows > 0;

        await connection.commit();

        return NextResponse.json({
            message: `Payment recorded for security deposit and advance rent. ${leaseUpdated ? "Lease updated." : ""}`,
            processed: true,
            requestReferenceNumber,
            confirmedItems: ["security_deposit", "advance_rent"],
            totalAmountConfirmed: parseFloat(totalAmount).toFixed(2),
        });
    } catch (error: any) {
        if (connection) await connection.end();
        console.error("Error during lease update:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
