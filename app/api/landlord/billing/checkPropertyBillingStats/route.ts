import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const property_id = searchParams.get("id");

  if (!property_id) {
    return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
  }

  try {
    const [billingData] = await db.query(
      `SELECT * FROM ConcessionaireBilling 
       WHERE property_id = ? 
       AND DATE_FORMAT(billing_period, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
      [property_id]
    );

    return NextResponse.json({ billingData });
  } catch (error) {
    console.error("Error fetching billing data:", error);
    return NextResponse.json({ error: "Database server error" }, { status: 500 });
  }
}
