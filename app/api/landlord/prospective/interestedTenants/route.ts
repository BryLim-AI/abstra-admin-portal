import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const unitId = searchParams.get("unitId");
  const tenant_id = searchParams.get("tenant_id");

  if (!unitId && !tenant_id) {
    return NextResponse.json(
      {
        message: "Missing required parameters: either unitId or tenant_id must be provided",
      },
      { status: 400 }
    );
  }

  try {
    let query = `
      SELECT pt.id, pt.status, pt.message, pt.valid_id, pt.created_at, pt.tenant_id,
             u.firstName, u.lastName, u.email, u.phoneNumber, u.profilePicture, u.birthDate,
             t.address, t.occupation, t.employment_type, t.monthly_income, t.tenant_id
      FROM ProspectiveTenant pt
      JOIN Tenant t ON pt.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      WHERE `;

    const params: any[] = [];

    if (tenant_id) {
      query += `pt.tenant_id = ?`;
      params.push(tenant_id);
    } else {
      query += `pt.unit_id = ?`;
      params.push(unitId);
    }

    const [tenants]: any[] = await db.query(query, params);

    if (tenant_id && tenants.length > 0) {
      const tenant = tenants[0];
      const decryptedTenant = {
        ...tenant,
        firstName: decryptData(JSON.parse(tenant.firstName), SECRET_KEY),
        lastName: decryptData(JSON.parse(tenant.lastName), SECRET_KEY),
        email: decryptData(JSON.parse(tenant.email), SECRET_KEY),
        phoneNumber: decryptData(JSON.parse(tenant.phoneNumber), SECRET_KEY),
        profilePicture: tenant.profilePicture
          ? decryptData(JSON.parse(tenant.profilePicture), SECRET_KEY)
          : null,
        valid_id: tenant.valid_id
          ? decryptData(JSON.parse(tenant.valid_id), SECRET_KEY)
          : null,
        address: tenant.address?.toString("utf8"),
        occupation: tenant.occupation,
        employment_type: tenant.employment_type,
        monthly_income: tenant.monthly_income,
        birthDate: tenant.birthDate
          ? decryptData(JSON.parse(tenant.birthDate), SECRET_KEY)
          : null,
      };

      return NextResponse.json(decryptedTenant, { status: 200 });
    }

    const decryptedTenants = tenants.map((tenant: any) => ({
      ...tenant,
      firstName: decryptData(JSON.parse(tenant.firstName), SECRET_KEY),
      lastName: decryptData(JSON.parse(tenant.lastName), SECRET_KEY),
      email: decryptData(JSON.parse(tenant.email), SECRET_KEY),
      phoneNumber: decryptData(JSON.parse(tenant.phoneNumber), SECRET_KEY),
      profilePicture: tenant.profilePicture
        ? decryptData(JSON.parse(tenant.profilePicture), SECRET_KEY)
        : null,
      valid_id: tenant.valid_id
        ? decryptData(JSON.parse(tenant.valid_id), SECRET_KEY)
        : null,
      address: tenant.address?.toString("utf8"),
      occupation: tenant.occupation,
      employment_type: tenant.employment_type,
      monthly_income: tenant.monthly_income,
      birthDate: tenant.birthDate
        ? decryptData(JSON.parse(tenant.birthDate), SECRET_KEY)
        : null,
    }));

    return NextResponse.json(decryptedTenants, { status: 200 });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { message: "Database error", error: error.message },
      { status: 500 }
    );
  }
}
