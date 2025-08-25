import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            billing_id,
            water_current_reading,
            electricity_current_reading,
            total_water_amount,
            total_electricity_amount,
            penalty_amount,
            discount_amount,
            total_amount_due,
            water_prev_reading,
            electricity_prev_reading
        } = body;

        if (!billing_id) {
            return NextResponse.json({ error: "Billing ID is required" }, { status: 400 });
        }

        const [billingRecord] = await db.query(
            `SELECT unit_id FROM Billing WHERE billing_id = ?`,
            [billing_id]
        );

        // @ts-ignore
        if (!billingRecord || billingRecord.length === 0) {
            return NextResponse.json({ error: "Billing record not found" }, { status: 404 });
        }

        // @ts-ignore
        const unit_id = billingRecord[0].unit_id;

        const [updateResult] = await db.query(
            `
        UPDATE Billing
        SET
          total_water_amount = ?,
          total_electricity_amount = ?,
          penalty_amount = ?,
          discount_amount = ?,
          total_amount_due = ?
        WHERE billing_id = ?
      `,
            [
                total_water_amount,
                total_electricity_amount,
                penalty_amount,
                discount_amount,
                total_amount_due,
                billing_id,
            ]
        );

        // @ts-ignore
        if (updateResult.affectedRows === 0) {
            return NextResponse.json({ error: "No changes made or billing record not found" }, { status: 404 });
        }

        if (water_current_reading !== undefined || water_prev_reading !== undefined) {
            const updateFields = [];
            const updateValues = [];

            if (water_current_reading !== undefined) {
                updateFields.push("current_reading = ?");
                updateValues.push(water_current_reading);
            }

            if (water_prev_reading !== undefined) {
                updateFields.push("previous_reading = ?");
                updateValues.push(water_prev_reading);
            }

            updateValues.push(unit_id);

            await db.query(
                `UPDATE MeterReading
                 SET ${updateFields.join(", ")}
                 WHERE unit_id = ?
                   AND utility_type = 'water'
                 ORDER BY reading_date DESC
                 LIMIT 1`,
                updateValues
            );
        }


        if (electricity_current_reading !== undefined || electricity_prev_reading !== undefined) {
            const updateFields = [];
            const updateValues = [];

            if (electricity_current_reading !== undefined) {
                updateFields.push("current_reading = ?");
                updateValues.push(electricity_current_reading);
            }

            if (electricity_prev_reading !== undefined) {
                updateFields.push("previous_reading = ?");
                updateValues.push(electricity_prev_reading);
            }

            updateValues.push(unit_id);

            await db.query(
                `UPDATE MeterReading
                 SET ${updateFields.join(", ")}
                 WHERE unit_id = ?
                   AND utility_type = 'electricity'
                 ORDER BY reading_date DESC
                 LIMIT 1`,
                updateValues
            );
        }


        return NextResponse.json({ message: "Billing and meter readings updated successfully" });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
