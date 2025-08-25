
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const connection = await db.getConnection();

  try {
    const body = await req.json();
    const { agreement_id, subject, description, category, user_id } = body;
      
    console.log('agreement id api: ', agreement_id);

    if (!agreement_id) {
      return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 });
    }

    // Get tenant, unit, and property info from agreement
    const [agreementResult] = await connection.execute(
      `
      SELECT la.tenant_id, la.unit_id, u.property_id
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      WHERE la.agreement_id = ? AND la.status = 'active'
      `,
      [agreement_id]
    );

    // @ts-ignore
    if (!agreementResult.length) {
      return NextResponse.json({ error: "No active lease found for agreement" }, { status: 404 });
    }

    // @ts-ignore
    const { tenant_id, unit_id, property_id } = agreementResult[0];

    const [landlordResult] = await connection.execute(
      `SELECT landlord_id FROM Property WHERE property_id = ?`,
      [property_id]
    );

    // @ts-ignore
    if (!landlordResult.length) {
      return NextResponse.json({ error: "Landlord not found for property" }, { status: 404 });
    }

    // @ts-ignore
    const { landlord_id } = landlordResult[0];

    // Create maintenance request
    const [result] = await connection.execute(
      `
      INSERT INTO MaintenanceRequest 
        (tenant_id, unit_id, subject, description, category, status) 
      VALUES (?, ?, ?, ?, ?, 'Pending')
      `,
      [tenant_id, unit_id, subject, description, category]
    );

    // @ts-ignore
    const request_id = result.insertId;

    // Activity Log
    await db.query(
      `INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())`,
      [user_id, `Created Maintenance Request: ${subject} - ${description}`]
    );

    return NextResponse.json({
      success: true,
      message: "Maintenance request created successfully",
      request_id,
      landlord_id,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating maintenance request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    connection.release?.();
  }
}
