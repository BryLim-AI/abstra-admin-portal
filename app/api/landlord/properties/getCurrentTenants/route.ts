import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const landlord_id = searchParams.get("landlord_id");

  if (!landlord_id) {
    return NextResponse.json(
      { message: "Missing landlord_id" },
      { status: 400 }
    );
  }

  try {
    const query = `
      SELECT
        t.tenant_id,
        t.employment_type,
        t.occupation,
        u.firstName,
        u.lastName,
        u.email,
        la.unit_id,
        la.start_date,
        p.property_name,
        la.end_date
      FROM Tenant t
      JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
      JOIN Unit un ON la.unit_id = un.unit_id
      JOIN Property p ON un.property_id = p.property_id
      JOIN User u ON t.user_id = u.user_id
      WHERE la.status = 'active' AND p.landlord_id = ?
      ORDER BY la.start_date DESC
    `;

    const [rows] = await db.execute(query, [landlord_id]);
    const tenants = rows as any[];

    const decryptedTenants = tenants.map((tenant) => ({
      ...tenant,
      email: decryptData(JSON.parse(tenant.email), SECRET_KEY),
      firstName: decryptData(JSON.parse(tenant.firstName), SECRET_KEY),
      lastName: decryptData(JSON.parse(tenant.lastName), SECRET_KEY),
    }));

    return NextResponse.json(decryptedTenants || []);
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
