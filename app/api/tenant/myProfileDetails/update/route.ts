// File: /app/api/tenant/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, address, occupation, employment_type, monthly_income } = body;

        if (!user_id) {
            return NextResponse.json({ error: "user_id is required" }, { status: 400 });
        }

        // Parameterized query
        const sql = `
      UPDATE Tenant
      SET address = ?, occupation = ?, employment_type = ?, monthly_income = ?
      WHERE user_id = ?
    `;
        const params = [address, occupation, employment_type, monthly_income, user_id];

        const [result] = await db.execute(sql, params);

        return NextResponse.json({ message: "Tenant details updated successfully", result });
    } catch (error) {
        console.error("Error updating tenant:", error);
        return NextResponse.json(
            { error: "Failed to update tenant details" },
            { status: 500 }
        );
    }
}
