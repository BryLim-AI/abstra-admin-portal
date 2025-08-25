import { db } from "@/lib/db"; // adjust path if needed
import { NextResponse, NextRequest} from "next/server";
import { ResultSetHeader, FieldPacket } from "mysql2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      unit_id,
      readingDate,
      waterPrevReading,
      waterCurrentReading,
      electricityPrevReading,
      electricityCurrentReading,
      totalWaterAmount,
      totalElectricityAmount,
      penaltyAmount,
      discountAmount,
      dueDate,
      total_amount_due,
    } = body;

    const [billingResult] = await db.execute(
      `INSERT INTO Billing (
        unit_id, billing_period, total_water_amount, total_electricity_amount,
        penalty_amount, discount_amount, due_date, total_amount_due
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        unit_id,
        readingDate,
        totalWaterAmount || 0,
        totalElectricityAmount || 0,
        penaltyAmount || 0,
        discountAmount || 0,
        dueDate,
        total_amount_due || 0,
      ]
    ) as [ResultSetHeader, FieldPacket[]];

    const billingId = billingResult.insertId;

    if (waterPrevReading !== null && waterCurrentReading !== null) {
      await db.execute(
        `INSERT INTO MeterReading (
          unit_id, utility_type, reading_date, previous_reading, current_reading
        ) VALUES (?, 'water', ?, ?, ?)`,
        [unit_id, readingDate, waterPrevReading, waterCurrentReading]
      );
    }

    if (electricityPrevReading !== null && electricityCurrentReading !== null) {
      await db.execute(
        `INSERT INTO MeterReading (
          unit_id, utility_type, reading_date, previous_reading, current_reading
        ) VALUES (?, 'electricity', ?, ?, ?)`,
        [unit_id, readingDate, electricityPrevReading, electricityCurrentReading]
      );
    }

    return NextResponse.json({
      message: "Billing Generated and meter readings saved successfully",
      billing_id: billingId,
    }, { status: 201 });

  } catch (error) {
    console.error("Error saving billing and meter readings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
