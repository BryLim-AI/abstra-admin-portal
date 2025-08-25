import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("unit_id");

    if (!unit_id) {
        return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
    }

    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        const [bill] = await db.query(
            `
      SELECT * FROM Billing
      WHERE unit_id = ?
        AND YEAR(billing_period) = ?
        AND MONTH(billing_period) = ?
      ORDER BY billing_period DESC
      LIMIT 1
      `,
            [unit_id, currentYear, currentMonth]
        );

        if (!bill || bill.length === 0) {
            return NextResponse.json(
                { error: "No bill found for the current month" },
                { status: 404 }
            );
        }

        const billingRecord = bill[0];

        const [waterReading] = await db.query(
            `
      SELECT previous_reading, current_reading, reading_date
      FROM MeterReading
      WHERE unit_id = ? AND utility_type = 'water'
      ORDER BY reading_date DESC
      LIMIT 1
      `,
            [unit_id]
        );

        const [electricityReading] = await db.query(
            `
      SELECT previous_reading, current_reading, reading_date
      FROM MeterReading
      WHERE unit_id = ? AND utility_type = 'electricity'
      ORDER BY reading_date DESC
      LIMIT 1
      `,
            [unit_id]
        );

        const [unitData] = await db.query(
            `
      SELECT rent_amount, property_id
      FROM Unit
      WHERE unit_id = ?
      `,
            [unit_id]
        );

        if (!unitData || unitData.length === 0) {
            return NextResponse.json({ error: "Unit data not found" }, { status: 404 });
        }

        const { rent_amount, property_id } = unitData[0];

        const [propertyData] = await db.query(
            `
      SELECT assoc_dues, late_fee
      FROM Property
      WHERE property_id = ?
      `,
            [property_id]
        );

        if (!propertyData || propertyData.length === 0) {
            return NextResponse.json({ error: "Property data not found" }, { status: 404 });
        }

        const { assoc_dues, late_fee } = propertyData[0];

        return NextResponse.json({
            ...billingRecord,
            water_prev_reading: waterReading?.[0]?.previous_reading ?? null,
            water_current_reading: waterReading?.[0]?.current_reading ?? null,
            electricity_prev_reading: electricityReading?.[0]?.previous_reading ?? null,
            electricity_current_reading: electricityReading?.[0]?.current_reading ?? null,
            rent_amount: rent_amount ?? 0,
            assoc_dues: assoc_dues ?? 0,
            late_fee: late_fee ?? 0,
        });
    } catch (error) {
        console.error("Error fetching bill:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
