import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { property_id, subject, description, landlord_id } = body;

    if (!property_id || !subject || !description || !landlord_id) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Get landlord's user_id
    const [landlordRows] = await db.execute(
      `SELECT user_id FROM Landlord WHERE landlord_id = ?`,
      [landlord_id]
    );
    const landlord = (landlordRows as any[])[0];

    if (!landlord) {
      return NextResponse.json(
        { message: "Landlord not found" },
        { status: 404 }
      );
    }

    const user_id = landlord.user_id;

    // Insert the announcement
    const insertAnnouncementQuery = `
      INSERT INTO Announcement (property_id, landlord_id, subject, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW());
    `;
    await db.execute(insertAnnouncementQuery, [
      property_id,
      landlord_id,
      subject,
      description,
    ]);

    // Log activity
    const logActivityQuery = `
      INSERT INTO ActivityLog (user_id, action, timestamp)
      VALUES (?, ?, NOW());
    `;
    await db.execute(logActivityQuery, [
      user_id,
      `Created Announcement ${subject} - ${description}`,
    ]);

    // Find active tenants in that property
    const tenantQuery = `
      SELECT DISTINCT t.user_id
      FROM LeaseAgreement la
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      JOIN Unit u ON la.unit_id = u.unit_id
      WHERE u.property_id = ? AND la.status = 'active'
    `;
    const [tenants] = await db.execute(tenantQuery, [property_id]);

    // Send notifications
    const notificationQuery = `
      INSERT INTO Notification (user_id, title, body, is_read, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    const maxBodyLength = 100;
    const truncatedDescription =
      description.length > maxBodyLength
        ? description.slice(0, maxBodyLength) + "..."
        : description;

    for (const tenant of tenants as any[]) {
      await db.execute(notificationQuery, [
        tenant.user_id,
        subject,
        truncatedDescription,
        0,
      ]);
    }

    return NextResponse.json(
      { message: "Announcement created and logged successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
