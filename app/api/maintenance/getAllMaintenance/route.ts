import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const landlord_id = searchParams.get("landlord_id");

  if (!landlord_id) {
    return NextResponse.json(
      { error: "Landlord ID is required" },
      { status: 400 }
    );
  }

  try {
    const query = `
      SELECT 
        mr.request_id,
        u.firstName AS tenant_first_name,
        u.lastName AS tenant_last_name,
        p.property_name,
        un.unit_name,
        mr.subject,
        mr.description,
        mr.category,
        mr.status,
        mr.created_at,
        COALESCE(GROUP_CONCAT(mp.photo_url SEPARATOR '||'), '[]') AS photo_urls
      FROM MaintenanceRequest mr
      JOIN Tenant t ON mr.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      JOIN Unit un ON mr.unit_id = un.unit_id
      JOIN Property p ON un.property_id = p.property_id
      LEFT JOIN MaintenancePhoto mp ON mr.request_id = mp.request_id
      WHERE p.landlord_id = ?
      GROUP BY mr.request_id, tenant_first_name, tenant_last_name, property_name, unit_name, subject, description, category, status, created_at
    `;

    const [requests] = await db.query(query, [landlord_id]);

    const decryptedRequests = (requests as any[]).map((req) => {
      let decryptedPhotos: string[] = [];
      let decryptedFirstName = req.tenant_first_name;
      let decryptedLastName = req.tenant_last_name;

      // Decrypt photos
      if (req.photo_urls && req.photo_urls !== "[]") {
        try {
          const parsedPhotos = req.photo_urls.split("||");
          // @ts-ignore
          decryptedPhotos = parsedPhotos.map((photo) =>
            decryptData(JSON.parse(photo), SECRET_KEY)
          );
        } catch (error) {
          console.error("Error decrypting photos:", error);
        }
      }

      // Decrypt names
      try {
        decryptedFirstName = decryptData(JSON.parse(req.tenant_first_name), SECRET_KEY);
        decryptedLastName = decryptData(JSON.parse(req.tenant_last_name), SECRET_KEY);
      } catch (error) {
        console.error("Error decrypting tenant details:", error);
      }

      return {
        ...req,
        tenant_first_name: decryptedFirstName,
        tenant_last_name: decryptedLastName,
        photo_urls: decryptedPhotos,
      };
    });

    return NextResponse.json({ success: true, data: decryptedRequests });
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
