import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const landlord_id = searchParams.get("landlord_id");

  let queryString: string;
  let queryParams: any[] = [];

  try {
    if (landlord_id) {
      queryString = `
        SELECT 
            pv.visit_id,
            u.user_id,
            u.firstName AS encrypted_first_name,
            u.lastName AS encrypted_last_name,
            p.property_name,
            un.unit_name,
            pv.visit_date,
            pv.visit_time,
            pv.status,
            pv.disapproval_reason
        FROM PropertyVisit pv
        JOIN Tenant t ON pv.tenant_id = t.tenant_id
        JOIN User u ON t.user_id = u.user_id
        JOIN Unit un ON pv.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        WHERE p.landlord_id = ?
        ORDER BY pv.visit_date ASC, pv.visit_time ASC;
      `;
      queryParams = [landlord_id];
    } else {
      queryString = `
        SELECT 
            pv.visit_id,
            u.user_id,
            u.firstName AS encrypted_first_name,
            u.lastName AS encrypted_last_name,
            p.property_name,
            un.unit_name,
            pv.visit_date,
            pv.visit_time,
            pv.status,
            pv.disapproval_reason
        FROM PropertyVisit pv
        JOIN Tenant t ON pv.tenant_id = t.tenant_id
        JOIN User u ON t.user_id = u.user_id
        JOIN Unit un ON pv.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        ORDER BY pv.visit_date ASC, pv.visit_time ASC;
      `;
    }

    const [requests] = await db.query(queryString, queryParams);

    const decryptedRequests = (requests as any[]).map((request) => {
      let tenantFirstName = "N/A";
      let tenantLastName = "N/A";

      try {
        // @ts-ignore
        tenantFirstName = decryptData(
          JSON.parse(request.encrypted_first_name),
          SECRET_KEY
        );
      } catch (err) {
        console.error("Error decrypting first name:", err);
      }

      try {
        // @ts-ignore
        tenantLastName = decryptData(
          JSON.parse(request.encrypted_last_name),
          SECRET_KEY
        );
      } catch (err) {
        console.error("Error decrypting last name:", err);
      }

      return {
        ...request,
        tenant_first_name: tenantFirstName,
        tenant_last_name: tenantLastName,
        status: request.status,
        disapproval_reason: request.disapproval_reason,
      };
    });

    return NextResponse.json(decryptedRequests);
  } catch (error) {
    console.error("Visit request API error:", error);
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
}
