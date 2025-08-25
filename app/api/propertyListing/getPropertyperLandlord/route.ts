import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");
    const property_id = searchParams.get("property_id");

    console.log("[DEBUG] Received request with:", {
      landlord_id,
      property_id,
    });

    if (!landlord_id && !property_id) {
      console.warn("[DEBUG] Missing both landlord_id and property_id.");
      return NextResponse.json({ error: "Missing landlord_id or property_id" }, { status: 400 });
    }

    let query = `
      SELECT
        p.*,
        pv.status AS verification_status,
        pv.admin_message AS verification_message
      FROM Property p
      LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
      WHERE 1=1
    `;

    let params: (string | number)[] = [];

    if (landlord_id) {
      query += ` AND p.landlord_id = ?`;
      params.push(landlord_id);
    }

    if (property_id) {
      query += ` AND p.property_id = ?`;
      params.push(property_id);
    }

    console.log("[DEBUG] Final query:", query);
    console.log("[DEBUG] Query params:", params);

    const [rows] = await db.query(query, params);
// @ts-ignore
    console.log("[DEBUG] Rows returned:", rows.length);
// @ts-ignore
    if ((property_id || landlord_id) && rows.length === 0) {
      console.warn("[DEBUG] No results found for given IDs.");
      return NextResponse.json({ error: "No properties found. " }, { status: 404 });
    }

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("[GET] Property fetch error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
