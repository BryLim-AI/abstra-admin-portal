import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

function isJsonLike(str: string) {
  return str.trim().startsWith("{");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const landlord_id = searchParams.get("landlord_id");

  if (!landlord_id) {
    return NextResponse.json(
      { message: "Landlord ID is required" },
      { status: 400 }
    );
  }

  try {
    const query = `
      SELECT property_id, property_name
      FROM Property
      WHERE landlord_id = ?
      ORDER BY property_name;
    `;

    console.log("Executing query with landlord_id:", landlord_id);
    const [properties] = await db.execute(query, [landlord_id]);
    console.log("Retrieved properties:", properties);

    const decryptedProperties = (properties as any[]).map((property) => ({
      ...property,
      property_name: isJsonLike(property.property_name)
        ? decryptData(JSON.parse(property.property_name), SECRET_KEY)
        : property.property_name,
    }));

    return NextResponse.json(decryptedProperties);
  } catch (error: any) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
