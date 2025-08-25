import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// PUT /api/unitListing/unit?id=...
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
  }

  let connection;
  try {
    const body = await req.json();
    connection = await db.getConnection();

    const [rows] = await connection.execute(
      `SELECT * FROM Unit WHERE unit_id = ?`,
      [id]
    );
// @ts-ignore
    if (rows.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Replace undefined with null
    Object.keys(body).forEach((key) => {
      if (body[key] === undefined) body[key] = null;
    });

    const {
      unitName,
      unitSize,
      bedSpacing,
      availBeds,
      rentAmt,
      furnish,
      secDeposit,
      advancedPayment,
      status,
        amenities,
    } = body;

    await connection.beginTransaction();
    const amenityString = Array.isArray(amenities) ? amenities.join(",") : amenities || "";

    const [result] = await connection.execute(
      `UPDATE Unit SET
        unit_name = ?, unit_size = ?, bed_spacing = ?,
        avail_beds = ?, rent_amount = ?, furnish = ?, status = ?, 
        sec_deposit = ?, advanced_payment = ?, amenities = ?, updated_at = CURRENT_TIMESTAMP
       WHERE unit_id = ?`,
      [
        unitName,
        unitSize,
        bedSpacing,
        availBeds,
        rentAmt,
        furnish,
        status ?? "unoccupied",
        secDeposit,
        advancedPayment,
        amenityString,
        id,
      ]
    );

    await connection.commit();

    return NextResponse.json({ unitId: id, ...body }, { status: 200 });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error in PUT /unit:", error);
    return NextResponse.json(
      { error: "Failed to update unit listing" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
