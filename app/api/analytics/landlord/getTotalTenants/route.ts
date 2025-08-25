import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const landlord_id = searchParams.get("landlord_id");

  if (!landlord_id) {
    return NextResponse.json(
      { message: "Missing landlord_id parameter" },
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.execute(
      `SELECT COUNT(DISTINCT la.tenant_id) AS total_tenants
       FROM LeaseAgreement la
       JOIN Unit u ON la.unit_id = u.unit_id
       JOIN Property pr ON u.property_id = pr.property_id
       WHERE pr.landlord_id = ? 
         AND la.status = 'active';`,
      [landlord_id]
    );

    // @ts-ignore
    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error("Error fetching tenant count:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
