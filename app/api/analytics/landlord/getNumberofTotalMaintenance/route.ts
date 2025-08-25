import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json({ message: "Missing landlord_id parameter" }, { status: 400 });
    }

    try {
        const [rows]: any = await db.execute(
            `SELECT COUNT(mr.request_id) AS total_requests
       FROM MaintenanceRequest mr
       JOIN Unit u ON mr.unit_id = u.unit_id
       JOIN Property pr ON u.property_id = pr.property_id
       WHERE pr.landlord_id = ?;`,
            [landlord_id]
        );

        return NextResponse.json(rows[0], { status: 200 });
    } catch (error: any) {
        console.error("Error fetching maintenance request count:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
