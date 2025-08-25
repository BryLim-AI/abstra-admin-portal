import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json(
                { error: "landlord_id is required" },
                { status: 400 }
            );
        }

        const [rows] = await db.query(
            `
            SELECT COUNT(*) AS totalActiveListings
            FROM Property p
            INNER JOIN PropertyVerification pv ON p.property_id = pv.property_id
            WHERE p.landlord_id = ?
              AND p.status = 'active'
              AND pv.status = 'Verified'
            `,
            [landlord_id]
        );

        // @ts-ignore
        return NextResponse.json({ totalActiveListings: rows[0]?.totalActiveListings || 0 });
    } catch (error) {
        console.error("Error fetching active listings count:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
