import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant_id = searchParams.get("tenant_id");

  if (!tenant_id) {
    return NextResponse.json(
      { error: "Missing tenant_id parameter" },
      { status: 400 }
    );
  }

  let connection: any;
  try {
    connection = await db.getConnection();

    const query = `
      SELECT agreement_id FROM LeaseAgreement 
      WHERE tenant_id = ?
      AND status = 'active' 
      AND created_at IS NOT NULL 
      AND updated_at IS NOT NULL 
      LIMIT 1
    `;
    const [rows] = await connection.execute(query, [tenant_id]);

    return NextResponse.json({ hasLease: rows.length > 0 });
  } catch (error: any) {
    console.error("Error checking lease agreement:", error);
    return NextResponse.json(
      { error: "Failed to check lease agreement: " + error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
