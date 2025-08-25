import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let agreementId = searchParams.get("agreement_id");
  const userId = searchParams.get("user_id");

  try {
    // 🔁 Fallback: fetch agreement if only user_id is provided
    if (!agreementId && userId) {
      const [agreementRows] = await db.query(
        `SELECT agreement_id 
         FROM LeaseAgreement 
         WHERE tenant_id = ?
         ORDER BY start_date DESC LIMIT 1`,
        [userId]
      );
      // @ts-ignore
      if (agreementRows.length === 0) {
        return NextResponse.json({ message: "No active lease found for user" }, { status: 404 });
      }
      // @ts-ignore
      agreementId = agreementRows[0].agreement_id;
    }

    if (!agreementId) {
      return NextResponse.json({ message: "Agreement ID or User ID is required" }, { status: 400 });
    }

    // ✅ Get tenant_id and unit_id from LeaseAgreement
    const [leaseRows] = await db.query(
      `SELECT tenant_id, unit_id 
       FROM LeaseAgreement 
       WHERE agreement_id = ?`,
      [agreementId]
    );

    // @ts-ignore
    if (leaseRows.length === 0) {
      return NextResponse.json({ message: "Lease not found" }, { status: 404 });
    }

    // @ts-ignore
    const { tenant_id, unit_id } = leaseRows[0];

    // ✅ Get maintenance requests for this tenant and unit
    const [maintenanceRequests] = await db.query(
      `SELECT m.*, u.unit_name, p.property_name
       FROM MaintenanceRequest m
       LEFT JOIN Unit u ON m.unit_id = u.unit_id
       LEFT JOIN Property p ON u.property_id = p.property_id
       WHERE m.tenant_id = ? AND m.unit_id = ?
       AND m.status IN ('Pending', 'Scheduled', 'In-Progress')`,
      [tenant_id, unit_id]
    );

    // ✅ Attach decrypted photos
    // @ts-ignore
    for (const request of maintenanceRequests) {
      const [photos] = await db.query(
        `SELECT photo_url FROM MaintenancePhoto WHERE request_id = ?`,
        [request.request_id]
      );

      // @ts-ignore
      request.photos = photos.length
        ? photos
              // @ts-ignore
              .map((photo: any) => {
              try {
                const parsed = JSON.parse(photo.photo_url);
                return decryptData(parsed, process.env.ENCRYPTION_SECRET!);
              } catch (err) {
                console.error("Failed to decrypt photo:", err);
                return null;
              }
            })
            .filter(Boolean)
        : [];
    }

    return NextResponse.json(maintenanceRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
