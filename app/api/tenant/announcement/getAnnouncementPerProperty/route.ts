import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
    }

    try {
        const [propertyResult] = await db.query(
            "SELECT unit_id, property_id FROM LeaseAgreement INNER JOIN Unit USING(unit_id) WHERE agreement_id = ?",
            [agreement_id]
        );

        if (!propertyResult.length) {
            return NextResponse.json({ announcements: [] });
        }

        const property_id = propertyResult[0].property_id;

        const [announcements] = await db.query(
            "SELECT announcement_id, subject, description, created_at FROM Announcement WHERE property_id = ? ORDER BY created_at DESC",
            [property_id]
        );

        return NextResponse.json({ announcements });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch announcements." }, { status: 500 });
    }
}
