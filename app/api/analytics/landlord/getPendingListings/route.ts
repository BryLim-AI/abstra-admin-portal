
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
      SELECT COUNT(*) AS pendingCount
      FROM Property p
      INNER JOIN PropertyVerification pv ON p.property_id = pv.property_id
      WHERE p.landlord_id = ?
        AND pv.status = 'Pending'
      `,
            [landlord_id]
        );

        // rows[0].pendingCount contains the count
        // @ts-ignore
        return NextResponse.json({ pendingCount: rows[0].pendingCount });
    } catch (error) {
        console.error("Error fetching pending count:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

