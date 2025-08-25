import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { message: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.execute(
            `
        SELECT 
          DATE_FORMAT(p.payment_date, '%Y-%m') AS month, 
          SUM(p.amount_paid) AS total_received
        FROM Payment p
        JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
        JOIN Unit u ON la.unit_id = u.unit_id
        JOIN Property pr ON u.property_id = pr.property_id
        WHERE pr.landlord_id = ? 
          AND p.payment_status = 'confirmed'
        GROUP BY month
        ORDER BY month;
      `,
            [landlord_id]
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching payment data:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
