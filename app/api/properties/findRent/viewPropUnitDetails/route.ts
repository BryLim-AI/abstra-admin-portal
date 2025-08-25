import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const rentId = req.nextUrl.searchParams.get("rentId");

  if (!rentId) {
    return NextResponse.json({ message: "Unit ID is required" }, { status: 400 });
  }

  try {
    // Fetch unit details and landlord_id
    const query = `
      SELECT u.*, p.landlord_id 
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      WHERE u.unit_id = ?
    `;

    const [units] = await db.execute(query, [rentId]);

    if (!units || !Array.isArray(units) || units.length === 0) {
      return NextResponse.json({ message: "Unit not found" }, { status: 404 });
    }

    const unit = units[0];

    // Fetch unit photos
    const [photos] = await db.query(
      `SELECT photo_url FROM UnitPhoto WHERE unit_id = ?`,
      [rentId]
    );

    // Decrypt unit photos
    const decryptedPhotos = photos
        // @ts-ignore
      .map((photo: any) => {
        try {
          return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
        } catch (error) {
          console.error("Error decrypting photo:", error);
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({
      unit,
      // @ts-ignore
      landlord_id: unit.landlord_id,
      photos: decryptedPhotos,
    });
  } catch (error) {
    console.error("Error fetching unit details:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
