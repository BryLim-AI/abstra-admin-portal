import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const encryptionSecret = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const unit_id = req.nextUrl.searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json(
        { error: "Missing required parameter: unit_id" },
        { status: 400 }
    );
  }

  let connection;
  try {
    connection = await db.getConnection();

    // STEP 1: Check for existing lease directly
    const [leaseRows] = await connection.execute(
        `SELECT * FROM LeaseAgreement
         WHERE unit_id = ?
         LIMIT 1`,
        [unit_id]
    );

    if ((leaseRows as any[]).length > 0) {
      // Lease exists, decrypt URL
      const decrypted = (leaseRows as any[]).map((row) => {
        try {
          const encryptedData = JSON.parse(row.agreement_url);
          const decryptedUrl = decryptData(encryptedData, encryptionSecret!);
          return { ...row, agreement_url: decryptedUrl };
        } catch (decryptionError) {
          console.error("Decryption Error:", decryptionError);
          return { ...row, agreement_url: null };
        }
      });

      return NextResponse.json(decrypted, { status: 200 });
    }

    // STEP 2: If no lease found, check prospective tenant
    const [tenantRows] = await connection.execute(
        `SELECT tenant_id FROM ProspectiveTenant
         WHERE unit_id = ? AND status = 'approved'
         LIMIT 1`,
        [unit_id]
    );

    if ((tenantRows as any[]).length === 0) {
      return NextResponse.json(
          { error: "No lease or approved prospective tenant found for this unit" },
          { status: 404 }
      );
    }

    const tenant_id = (tenantRows as any[])[0].tenant_id;

    const [prospectiveLeaseRows] = await connection.execute(
        `SELECT * FROM LeaseAgreement
         WHERE tenant_id = ? AND unit_id = ?
         LIMIT 1`,
        [tenant_id, unit_id]
    );

    if ((prospectiveLeaseRows as any[]).length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const decrypted = (prospectiveLeaseRows as any[]).map((row) => {
      try {
        const encryptedData = JSON.parse(row.agreement_url);
        const decryptedUrl = decryptData(encryptedData, encryptionSecret!);
        return { ...row, agreement_url: decryptedUrl };
      } catch (decryptionError) {
        console.error("Decryption Error:", decryptionError);
        return { ...row, agreement_url: null };
      }
    });

    return NextResponse.json(decrypted, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching lease agreement:", error);
    return NextResponse.json(
        { error: "Failed to fetch lease agreement: " + error.message },
        { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
