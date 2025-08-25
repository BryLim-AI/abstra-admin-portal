import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

function isJsonLike(str: string) {
  return str.trim().startsWith("{");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing announcement ID" },
      { status: 400 }
    );
  }

  try {
    const query = `
      SELECT a.announcement_id, a.subject, a.description, a.created_at, p.property_name, a.property_id
      FROM Announcement a
      JOIN Property p ON a.property_id = p.property_id
      WHERE a.announcement_id = ?
    `;

    const [rows] = await db.execute(query, [id]);
    const announcements = rows as any[];

    if (announcements.length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    const announcement = announcements[0];

    try {
      announcement.subject = isJsonLike(announcement.subject)
        ? decryptData(JSON.parse(announcement.subject), SECRET_KEY)
        : announcement.subject;

      announcement.description = isJsonLike(announcement.description)
        ? decryptData(JSON.parse(announcement.description), SECRET_KEY)
        : announcement.description;
    } catch (decryptError) {
      console.error("Error decrypting announcement:", decryptError);
      return NextResponse.json(
        { error: "Error decrypting announcement data" },
        { status: 500 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error: any) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
