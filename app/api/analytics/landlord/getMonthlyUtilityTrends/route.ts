import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");
    const property_id = searchParams.get("property_id");

    if (!landlord_id) {
        return NextResponse.json(
            { message: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        let query = `
      SELECT DATE_FORMAT(cb.billing_period, '%Y-%m') AS month, 
             cb.utility_type,
             SUM(cb.total_billed_amount) AS total_expense
      FROM ConcessionaireBilling cb
      JOIN Property pr ON cb.property_id = pr.property_id
      WHERE pr.landlord_id = ?
    `;
        const params: any[] = [landlord_id];

        // Optional filter by property_id
        if (property_id && property_id !== "all") {
            query += " AND pr.property_id = ?";
            params.push(property_id);
        }

        query += `
      GROUP BY month, cb.utility_type
      ORDER BY month;
    `;

        const [rows]: any = await db.execute(query, params);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching monthly utility trend:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
