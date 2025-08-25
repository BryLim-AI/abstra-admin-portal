import { decryptData } from "@/crypto/encrypt";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const unit_id = searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
  }

  try {
    const [unitRows] = await db.query("SELECT * FROM Unit WHERE unit_id = ?", [
      unit_id,
    ]);

    // @ts-ignore
    if (unitRows.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // @ts-ignore
    const unit = unitRows[0];

    const [propertyRows] = await db.query(
      "SELECT * FROM Property WHERE property_id = ?",
      [unit.property_id]
    );
    // @ts-ignore
    const property = propertyRows.length > 0 ? propertyRows[0] : null;

    const [photoRows] = await db.query(
      "SELECT * FROM UnitPhoto WHERE unit_id = ?",
      [unit_id]
    ) as[any[], any];

    // @ts-ignore
    const decryptedPhotos = photoRows
      .map((photo: any) => {
        try {
          return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
        } catch (error) {
          console.error("Error decrypting photo:", error);
          return null;
        }
      })
        .filter((photo) => photo !== null);

    return NextResponse.json(
      {
        unit,
        property,
        photos: decryptedPhotos,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching unit details:", error);
    return NextResponse.json(
      { error: "Internal Server Error", detail: error.message },
      { status: 500 }
    );
  }
}
