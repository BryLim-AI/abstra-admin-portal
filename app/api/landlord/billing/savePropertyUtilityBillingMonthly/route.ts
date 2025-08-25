import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { id, billingPeriod, electricityTotal, electricityRate, waterTotal, waterRate } = await req.json();

    if (!id || !billingPeriod || (!electricityTotal && !waterTotal)) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (electricityTotal && electricityRate) {
      await db.execute(
        `INSERT INTO ConcessionaireBilling 
         (property_id, billing_period, utility_type, total_billed_amount, rate_consumed, created_at) 
         VALUES (?, ?, 'electricity', ?, ?, NOW())`,
        [id, billingPeriod, electricityTotal, electricityRate]
      );
    }

    if (waterTotal && waterRate) {
      await db.execute(
        `INSERT INTO ConcessionaireBilling 
         (property_id, billing_period, utility_type, total_billed_amount, rate_consumed, created_at) 
         VALUES (?, ?, 'water', ?, ?, NOW())`,
        [id, billingPeriod, waterTotal, waterRate]
      );
    }

    return NextResponse.json({ message: "Billing records saved successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: `Database Server Error: ${error}` }, { status: 500 });
  }
}

// Getting Rates
export async function GET(req:NextRequest) {
  const { searchParams } = new URL(req.url);
  const property_id = searchParams.get("id");

  if (!property_id) {
    return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
  }

  try {
    const [billings] = await db.execute(
      `SELECT utility_type, total_billed_amount, rate_consumed, billing_period, created_at
       FROM ConcessionaireBilling
       WHERE property_id = ?
         AND created_at = (
           SELECT MAX(created_at)
           FROM ConcessionaireBilling
           WHERE property_id = ?
           AND utility_type = ConcessionaireBilling.utility_type
         )`,
      [property_id, property_id]
    );

    return NextResponse.json(Array.isArray(billings) ? billings : [], { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: `Database Server Error: ${error}` }, { status: 500 });
  }
}
