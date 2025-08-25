import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const agreement_id = searchParams.get("agreement_id");

    if (!user_id) {
      return NextResponse.json(
        { message: "Missing user_id parameter" },
        { status: 400 }
      );
    }

    let property_id: number | null = null;
    let landlord_id: number | null = null;

    if (agreement_id) {
      const [result]: any = await db.execute(
        `
        SELECT p.property_id, p.landlord_id
        FROM LeaseAgreement la
        JOIN Unit u ON la.unit_id = u.unit_id
        JOIN Property p ON u.property_id = p.property_id
        WHERE la.agreement_id = ?
        `,
        [agreement_id]
      );

      if (result.length === 0) {
        return NextResponse.json(
          { message: "Invalid agreement_id or no property found." },
          { status: 404 }
        );
      }

      property_id = result[0].property_id;
      landlord_id = result[0].landlord_id;
    } else {
      const [tenant]: any = await db.execute(
        "SELECT tenant_id FROM Tenant WHERE user_id = ?",
        [user_id]
      );

      if (tenant.length === 0) {
        return NextResponse.json(
          { message: "Tenant not found" },
          { status: 404 }
        );
      }

      const tenantId = tenant[0].tenant_id;

      const [property]: any = await db.execute(
        `SELECT p.property_id, p.landlord_id 
         FROM Property p 
         JOIN Unit u ON p.property_id = u.property_id 
         JOIN LeaseAgreement la ON u.unit_id = la.unit_id 
         WHERE la.tenant_id = ? 
         ORDER BY la.start_date DESC
         LIMIT 1`,
        [tenantId]
      );

      if (property.length === 0) {
        return NextResponse.json(
          { message: "No associated property found" },
          { status: 404 }
        );
      }

      property_id = property[0].property_id;
      landlord_id = property[0].landlord_id;
    }

    const [systemAnnouncementsRaw]: any = await db.execute(
      "SELECT id, title, message, created_at FROM AdminAnnouncement WHERE target_audience IN ('all', 'tenant')"
    );

    const systemAnnouncements = systemAnnouncementsRaw.map((ann: any) => ({
      unique_id: `sys-${ann.id}`,
      title: ann.title,
      message: ann.message,
      created_at: ann.created_at,
    }));

    let landlordAnnouncements = [];

    if (landlord_id) {
      const [landlordAnnouncementsRaw]: any = await db.execute(
        `
        SELECT announcement_id, subject AS title, description AS message, created_at 
        FROM Announcement 
        WHERE landlord_id = ? AND property_id = ?
        `,
        [landlord_id, property_id]
      );

      landlordAnnouncements = landlordAnnouncementsRaw.map((ann: any) => ({
        unique_id: `ll-${ann.announcement_id}`,
        title: ann.title,
        message: ann.message,
        created_at: ann.created_at,
      }));
    }

    const announcements = [
      ...systemAnnouncements,
      ...landlordAnnouncements,
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
