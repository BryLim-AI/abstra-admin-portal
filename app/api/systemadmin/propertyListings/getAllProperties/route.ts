import { db } from "@/lib/db";
// @ts-ignore
export async function GET(req) {
  try {
    const [properties] = await db.query(`
      SELECT 
        p.property_id, 
        p.landlord_id,
        p.property_name, 
        p.city, 
        pv.status AS verification_status,
        pv.reviewed_by,
        pv.attempts
      FROM Property p
      LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
    `);

    return Response.json({ properties });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
