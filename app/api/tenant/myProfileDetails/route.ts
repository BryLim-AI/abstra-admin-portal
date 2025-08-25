// File: /app/api/tenant/details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
        return NextResponse.json({ error: "Missing user_id parameter" }, { status: 400 });
    }

    try {
        const [rows] = await db.execute(
            "SELECT address, occupation, employment_type, monthly_income FROM Tenant WHERE user_id = ?",
            [user_id]
        );

        // rows will be an array of results
        if (!rows || (Array.isArray(rows) && rows.length === 0)) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // Convert varbinary address to string if needed
        const tenant = (rows as any)[0];
        tenant.address = tenant.address.toString();

        return NextResponse.json(tenant);
    } catch (err) {
        console.error("Failed to fetch tenant details:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
