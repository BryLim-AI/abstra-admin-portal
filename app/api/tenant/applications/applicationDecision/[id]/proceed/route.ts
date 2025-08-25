import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
    params: {
        id: string;
    };
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const prospectiveTenantId = params.id;
    const { decision } = await req.json();

    if (!["yes", "no"].includes(decision)) {
        return NextResponse.json({ error: "Invalid decision value. Must be 'yes' or 'no'." }, { status: 400 });
    }

    try {
        // Only allow update if already approved
        const [rows] = await db.query(
            `SELECT * FROM ProspectiveTenant WHERE id = ? AND status = 'approved'`,
            [prospectiveTenantId]
        );

        if ((rows as any[]).length === 0) {
            return NextResponse.json({ error: "Application not found or not approved." }, { status: 404 });
        }

        await db.query(
            `UPDATE ProspectiveTenant SET proceeded = ? WHERE id = ?`,
            [decision, prospectiveTenantId]
        );

        return NextResponse.json({ success: true, proceeded: decision });
    } catch (error) {
        console.error("Error updating tenant decision:", error);
        return NextResponse.json({ error: "Database server error." }, { status: 500 });
    }
}
