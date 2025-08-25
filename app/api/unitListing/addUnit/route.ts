import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    property_id,
    unitName,
    unitSize,
    bedSpacing,
    availBeds,
    rentAmt,
    furnish,
    secDeposit,
    advancedPayment,
    amenities,
    status,
  } = body;

  if (!property_id) {
    return NextResponse.json({ error: "property id is required" }, { status: 400 });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Ensure amenities is saved as comma-separated string if it's an array
    const amenityString = Array.isArray(amenities) ? amenities.join(",") : amenities || "";

    const values = [
      property_id,
      unitName,
      unitSize,
      bedSpacing,
      availBeds,
      rentAmt,
      furnish,
      secDeposit || 0,
      advancedPayment || 0,
      amenityString,
      status || "unoccupied",
    ];

    console.log("Values array:", values);

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO Unit 
        (property_id, unit_name, unit_size, bed_spacing, avail_beds, rent_amount, furnish, sec_deposit, advanced_payment, amenities, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );

    await connection.commit();
// @ts-ignore
    return NextResponse.json({ unitId: result.insertId, ...body }, { status: 201 });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error creating unit listings:", error);
    return NextResponse.json({ error: "Failed to create unit listing" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
