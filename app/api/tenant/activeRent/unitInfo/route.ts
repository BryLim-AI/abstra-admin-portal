import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agreementId = searchParams.get("agreement_id");

  if (!agreementId) {
    return NextResponse.json(
      { message: "Missing agreement_id" },
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.query(
      `SELECT u.unit_name, p.property_name
       FROM LeaseAgreement la
       JOIN Unit u ON la.unit_id = u.unit_id
       JOIN Property p ON u.property_id = p.property_id
       WHERE la.agreement_id = ?`,
      [agreementId]
    );
// @ts-ignore
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: "No unit or property found for the given agreement" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      // @ts-ignore
      unit_name: rows[0].unit_name,
      // @ts-ignore
      property_name: rows[0].property_name,
    });
  } catch (error) {
    console.error("Error fetching unit and property:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
