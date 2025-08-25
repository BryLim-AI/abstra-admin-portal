import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const encryptionSecret = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const unit_id = req.nextUrl.searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json(
        { error: "Unit ID is required" },
        { status: 400 }
    );
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Step 1: Try fetching from LeaseAgreement (if pending)
    const [leaseRows] = await connection.execute(
        `SELECT l.tenant_id
         FROM LeaseAgreement l
         WHERE l.unit_id = ? AND (l.status = 'pending' OR l.status = 'active')
         LIMIT 1`,
        [unit_id]
    );

    let tenant_id: string | null = null;
    let valid_id_encrypted: string | null = null;

    if ((leaseRows as any[]).length > 0) {
      // There is a pending lease → get tenant from LeaseAgreement
      tenant_id = (leaseRows as any[])[0].tenant_id;

      // Optional: Try to find valid_id from ProspectiveTenant (if needed)
      const [pt] = await connection.execute(
          `SELECT valid_id FROM ProspectiveTenant WHERE tenant_id = ? AND unit_id = ? LIMIT 1`,
          [tenant_id, unit_id]
      );
      if ((pt as any[]).length > 0) {
        valid_id_encrypted = (pt as any[])[0].valid_id;
      }
    } else {
      // Step 2: Fallback to ProspectiveTenant
      const [prospectiveTenant] = await connection.execute(
          `SELECT tenant_id, valid_id
         FROM ProspectiveTenant
         WHERE unit_id = ? AND status = 'approved'
         LIMIT 1`,
          [unit_id]
      );

      if ((prospectiveTenant as any[]).length === 0) {
        return NextResponse.json(
            { error: "No tenant found for this unit" },
            { status: 404 }
        );
      }

      tenant_id = (prospectiveTenant as any[])[0].tenant_id;
      valid_id_encrypted = (prospectiveTenant as any[])[0].valid_id;
    }

    // Step 3: Fetch tenant + user details
    const [tenantDetails] = await connection.execute(
        `SELECT t.user_id, t.occupation, t.employment_type, t.monthly_income, t.address,
                u.firstName, u.lastName, u.birthDate, u.phoneNumber, u.email
         FROM Tenant t
                JOIN User u ON t.user_id = u.user_id
         WHERE t.tenant_id = ?`,
        [tenant_id]
    );

    if ((tenantDetails as any[]).length === 0) {
      return NextResponse.json(
          { error: "Tenant details not found" },
          { status: 404 }
      );
    }

    const tenant = (tenantDetails as any[])[0];

    const response = {
      firstName: decryptData(JSON.parse(tenant.firstName), encryptionSecret!),
      lastName: decryptData(JSON.parse(tenant.lastName), encryptionSecret!),
      birthDate: decryptData(JSON.parse(tenant.birthDate), encryptionSecret!),
      phoneNumber: decryptData(JSON.parse(tenant.phoneNumber), encryptionSecret!),
      email: decryptData(JSON.parse(tenant.email), encryptionSecret!),
      monthlyIncome: tenant.monthly_income,
      occupation: tenant.occupation,
      employmentType: tenant.employment_type,
      validId: valid_id_encrypted
          ? decryptData(JSON.parse(valid_id_encrypted), encryptionSecret!)
          : null,
      address: tenant.address.toString("utf8"),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
