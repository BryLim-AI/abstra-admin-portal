import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const tenantId = req.nextUrl.searchParams.get("tenantId");
    console.log("api tenant id: ", tenantId);

    if (!tenantId) {
        return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
    }

    try {
        const [rows] = await db.query(
            `
                SELECT
                    pt.id,
                    pt.unit_id,
                    pt.valid_id,
                    pt.proof_of_income,
                    pt.message,
                    pt.proceeded,
                    pt.status,
                    pt.created_at,
                    u.unit_name,
                    u.rent_amount,
                    p.property_name
                FROM ProspectiveTenant pt
                         LEFT JOIN Unit u ON pt.unit_id = u.unit_id
                         LEFT JOIN Property p ON u.property_id = p.property_id
                WHERE pt.tenant_id = ?
                ORDER BY pt.created_at DESC
            `,
            [tenantId]
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error("DB error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
