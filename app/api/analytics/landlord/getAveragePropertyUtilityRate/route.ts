import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // adjust if needed based on your project structure

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json({ message: "Missing landlord_id parameter" }, { status: 400 });
    }

    try {
        const [rows]: any = await db.execute(
            `SELECT cb.property_id, 
              cb.utility_type, 
              AVG(cb.rate_consumed) AS avg_rate_consumed
       FROM ConcessionaireBilling cb
       JOIN Property pr ON cb.property_id = pr.property_id
       WHERE pr.landlord_id = ?
       GROUP BY cb.property_id, cb.utility_type
       ORDER BY cb.property_id;`,
            [landlord_id]
        );

        return NextResponse.json(rows, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching average utility rate:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
