// app/api/subscription/payment-success/route.ts

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Always run on server
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { requestReferenceNumber, landlord_id, plan_name, amount } = await req.json();

        // Validate required fields
        if (!requestReferenceNumber || !landlord_id || !plan_name || !amount) {
            console.error("[ERROR] Missing required parameters:", { requestReferenceNumber, landlord_id, plan_name, amount });
            return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
        }

        console.log("[DEBUG] Payment Success - Processing Subscription Update:", {
            requestReferenceNumber,
            landlord_id,
            plan_name,
            amount,
        });

        const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
        });

        const start_date = new Date().toISOString().split("T")[0];
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        const formatted_end_date = endDate.toISOString().split("T")[0];

        console.log("Deactivating Previous Subscriptions...");
        await connection.execute(
            "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?",
            [landlord_id]
        );
        console.log("Previous subscriptions deactivated:", landlord_id);

        console.log("Inserting New Subscription...");
        await connection.execute(
            `INSERT INTO Subscription 
        (landlord_id, plan_name, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, amount_paid, is_active) 
        VALUES (?, ?, ?, ?, 'paid', NOW(), ?, 0, ?, 1)`,
            [landlord_id, plan_name, start_date, formatted_end_date, requestReferenceNumber, amount]
        );
        console.log("Subscription successfully inserted for landlord:", landlord_id);

        await connection.end();
        console.log("Database connection closed.");

        return NextResponse.json({ message: "Subscription activated successfully." }, { status: 200 });
    } catch (error: any) {
        console.error("Failed to update subscription:", error.message || error);
        return NextResponse.json(
            { error: "Failed to update subscription.", details: error.message || String(error) },
            { status: 500 }
        );
    }
}

// Optional method guard
export async function GET() {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
