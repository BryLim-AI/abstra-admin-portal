import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");

        if (!landlordId) {
            return NextResponse.json(
                { error: "landlord_id is required" },
                { status: 400 }
            );
        }

        // Join Property with PropertyVerification
        const [properties] = await db.query(
            `
      SELECT 
        p.*, 
        pv.status AS verification_status
      FROM Property p
      LEFT JOIN PropertyVerification pv 
        ON p.property_id = pv.property_id
      WHERE p.landlord_id = ?
      `,
            [landlordId]
        );

        return NextResponse.json(properties);
    } catch (error) {
        console.error("Error fetching properties with verification:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
