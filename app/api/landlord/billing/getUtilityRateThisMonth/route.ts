import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("unit_id");

    if (!unit_id) {
        return new Response(JSON.stringify({ error: "Unit ID is required" }), {
            status: 400,
        });
    }

    try {
        const [unitRecord] = await db.query(
            `SELECT property_id FROM Unit WHERE unit_id = ?`,
            [unit_id]
        );

        // @ts-ignore
        if (!unitRecord || unitRecord.length === 0) {
            return new Response(JSON.stringify({ error: "Unit not found" }), {
                status: 404,
            });
        }

        // @ts-ignore
        const { property_id } = unitRecord[0];

        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const currentMonthEnd = new Date();
        currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1, 0);
        currentMonthEnd.setHours(23, 59, 59, 999);

        const [rates] = await db.query(
            `SELECT utility_type, rate_consumed 
       FROM ConcessionaireBilling 
       WHERE property_id = ? 
       AND billing_period BETWEEN ? AND ?
       ORDER BY billing_period DESC`,
            [property_id, currentMonthStart, currentMonthEnd]
        );

        // @ts-ignore
        if (!rates || rates.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "No concessionaire rates found for this property in the current month",
                }),
                { status: 404 }
            );
        }

        let water_rate = null;
        let electricity_rate = null;

        // @ts-ignore
        rates.forEach((rate: any) => {
            if (rate.utility_type === "water") {
                water_rate = rate.rate_consumed;
            } else if (rate.utility_type === "electricity") {
                electricity_rate = rate.rate_consumed;
            }
        });

        return new Response(
            JSON.stringify({
                unit_id,
                property_id,
                water_rate: water_rate || 0,
                electricity_rate: electricity_rate || 0,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Database Error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
        });
    }
}
