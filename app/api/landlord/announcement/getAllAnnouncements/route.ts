import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import type { RowDataPacket, FieldPacket } from 'mysql2';

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

function isValidJson(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const landlord_id = searchParams.get("landlord_id");

  if (!landlord_id) {
    return NextResponse.json(
      { message: "Missing landlord_id parameter" },
      { status: 400 }
    );
  }

  try {
    const query = `
      SELECT
        a.announcement_id, 
        a.property_id,
        a.subject,
        a.description,
        a.created_at,
        p.property_name
      FROM Announcement a
      JOIN Property p ON a.property_id = p.property_id
      WHERE a.landlord_id = ?
      ORDER BY a.created_at DESC;
    `;

    console.log("Executing query with landlord_id:", landlord_id);
    const [announcements]: [RowDataPacket[], FieldPacket[]] = await db.execute(query, [landlord_id]);
    console.log("Raw announcements:", announcements);

    const decryptedAnnouncements = announcements.map((announcement: any) => {
      try {
        return {
          id: announcement.announcement_id,
          subject: isValidJson(announcement.subject)
            ? decryptData(JSON.parse(announcement.subject), SECRET_KEY)
            : announcement.subject,
          description: isValidJson(announcement.description)
            ? decryptData(JSON.parse(announcement.description), SECRET_KEY)
            : announcement.description,
          property: announcement.property_name,
          property_id: announcement.property_id,
          created_at: announcement.created_at,
        };
      } catch (error) {
        console.error("Error decrypting announcement:", error, announcement);
        return {
          ...announcement,
          subject: "Error decrypting",
          description: "Error decrypting",
        };
      }
    });

    console.log("Decrypted announcements:", decryptedAnnouncements);
    return NextResponse.json(decryptedAnnouncements);
  } catch (error: any) {
    console.error("Detailed error in get-announcements:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
