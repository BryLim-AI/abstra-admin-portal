import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MAINTENANCE_CATEGORIES } from "@/constant/maintenanceCategories";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        const result: any = await db.query(
            `
        SELECT mr.category, COUNT(*) AS count
        FROM MaintenanceRequest mr
        JOIN Unit u ON mr.unit_id = u.unit_id
        JOIN Property p ON u.property_id = p.property_id
        WHERE p.landlord_id = ?
        GROUP BY mr.category
      `,
            [landlord_id]
        );

        const categoryCountMap: Record<string, number> = {};
        const categoryResults = Array.isArray(result[0]) ? result[0] : result;

        categoryResults.forEach(({ category, count }) => {
            categoryCountMap[category] = Number(count);
        });

        const categories = MAINTENANCE_CATEGORIES.map((category) => ({
            category: category.value,
            label: category.label,
            count: categoryCountMap[category.value] || 0,
        }));

        return NextResponse.json({ categories });
    } catch (error) {
        console.error("Error fetching maintenance categories:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
