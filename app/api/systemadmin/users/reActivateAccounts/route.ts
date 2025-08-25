import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, userType } = body;

    if (!user_id || !userType) {
      return NextResponse.json(
        { error: "Missing user_id or userType" },
        { status: 400 }
      );
    }

    if (userType === "landlord") {
      const [landlordRows]: any = await db.query(
        `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
        [user_id]
      );

      if (!landlordRows.length) {
        return NextResponse.json(
          { error: "Landlord account not found." },
          { status: 400 }
        );
      }

      const landlordId = landlordRows[0].landlord_id;

      await db.query(
        `UPDATE Property SET status = 'active' WHERE landlord_id = ?`,
        [landlordId]
      );

      await db.query(
        `UPDATE Unit u 
         JOIN Property p ON u.property_id = p.property_id
         SET u.status = 'active' 
         WHERE p.landlord_id = ?`,
        [landlordId]
      );

      await db.query(
        `UPDATE User SET status = 'active' WHERE user_id = ?`,
        [user_id]
      );

      return NextResponse.json(
        { success: true, message: "Landlord account reactivated successfully." },
        { status: 200 }
      );
    }

    if (userType === "tenant") {
      const [tenantRows]: any = await db.query(
        `SELECT tenant_id FROM Tenant WHERE user_id = ?`,
        [user_id]
      );

      if (!tenantRows.length) {
        return NextResponse.json(
          { error: "Tenant account not found." },
          { status: 400 }
        );
      }

      const tenantId = tenantRows[0].tenant_id;

      const [tenantLeaseRows]: any = await db.query(
        `SELECT COUNT(*) AS active_lease_count FROM LeaseAgreement WHERE tenant_id = ? AND status = 'active'`,
        [tenantId]
      );

      const activeLeaseCount = tenantLeaseRows[0]?.active_lease_count || 0;

      if (activeLeaseCount > 0) {
        return NextResponse.json(
          { error: "You cannot reactivate your account. You have an active lease." },
          { status: 400 }
        );
      }

      await db.query(
        `UPDATE User SET status = 'active' WHERE user_id = ?`,
        [user_id]
      );

      return NextResponse.json(
        { success: true, message: "Tenant account reactivated successfully." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid userType." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error reactivating account:", error);
    return NextResponse.json(
      { error: "Failed to reactivate account." },
      { status: 500 }
    );
  }
}
