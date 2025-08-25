import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let agreementId = searchParams.get("agreement_id");
  const userId = searchParams.get("user_id");

  try {
    if (!agreementId && userId) {
      const [agreements] = await db.query(
        `SELECT agreement_id FROM LeaseAgreement WHERE tenant_id = ? ORDER BY start_date DESC LIMIT 1`,
        [userId]
      );
// @ts-ignore
      if (!agreements.length) {
        return NextResponse.json({ message: "No lease agreement found for user." }, { status: 404 });
      }
// @ts-ignore
      agreementId = agreements[0].agreement_id;
    }

    if (!agreementId) {
      return NextResponse.json({ message: "Agreement ID or User ID is required" }, { status: 400 });
    }

    // ✅ Get unit_id from LeaseAgreement
    const [leaseRows] = await db.query(
      `SELECT unit_id FROM LeaseAgreement WHERE agreement_id = ?`,
      [agreementId]
    );
// @ts-ignore
    if (!leaseRows.length) {
      return NextResponse.json({ message: "Lease agreement not found" }, { status: 404 });
    }
// @ts-ignore
    const unitId = leaseRows[0].unit_id;
    console.log("📦 unit_id:", unitId);

    // ✅ Get latest Billing for unit
    // ✅ Get billing for the current month
const [billingRows] = await db.query(
  `SELECT * FROM Billing 
   WHERE unit_id = ? 
     AND MONTH(billing_period) = MONTH(CURRENT_DATE())
     AND YEAR(billing_period) = YEAR(CURRENT_DATE())
   LIMIT 1`,
  [unitId]
);

// @ts-ignore
    const billing = billingRows.length ? billingRows[0] : null;
    console.log("💸 Latest billing:", billing);

    // ✅ Get last 2 meter readings per utility type
    const [meterReadings] = await db.query(
      `SELECT * FROM MeterReading 
       WHERE unit_id = ? 
       ORDER BY utility_type, reading_date DESC`,
      [unitId]
    );

    // Group and trim to latest 2 per utility
    const groupedReadings = {
      water: [],
      electricity: [],
    };
// @ts-ignore
    for (const reading of meterReadings) {
      if (reading.utility_type === "water" && groupedReadings.water.length < 2) {
          // @ts-ignore
        groupedReadings.water.push(reading);
      }
      if (reading.utility_type === "electricity" && groupedReadings.electricity.length < 2) {
          // @ts-ignore
        groupedReadings.electricity.push(reading);
      }
    }

    return NextResponse.json(
      {
        billing,
        meterReadings: groupedReadings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Billing route error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
