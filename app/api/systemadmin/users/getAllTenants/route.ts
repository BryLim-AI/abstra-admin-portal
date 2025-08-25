import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const [tenants]: any = await db.query(`
      SELECT t.*, u.email AS user_email
      FROM Tenant t
      JOIN User u ON t.user_id = u.user_id
      WHERE status = 'active'
    `);

    const decryptedTenants = tenants.map((tenant: any) => {
      let decryptedEmail = tenant.user_email;

      try {
        if (tenant.user_email) {
          decryptedEmail = decryptData(
            JSON.parse(tenant.user_email),
            process.env.ENCRYPTION_SECRET!
          );
        }
      } catch (err) {
        console.error(
          `Failed to decrypt email for tenant with id ${tenant.tenant_id || "N/A"}:`,
          err
        );
      }

      return {
        ...tenant,
        email: decryptedEmail,
      };
    });

    return NextResponse.json({ tenants: decryptedTenants }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
