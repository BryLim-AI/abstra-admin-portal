import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextResponse } from "next/server";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const property_id = searchParams.get("property_id");

  try {
    let query = `SELECT * FROM PropertyPhoto`;
    let params: any[] = [];

    if (property_id) {
      query += ` WHERE property_id = ?`;
      params.push(property_id);
    }

    const [rows] = await db.query(query, params);
// @ts-ignore
    const decryptedRows = rows.map((row: any) => {
      try {
        const encryptedData = JSON.parse(row.photo_url);
        const decryptedUrl = decryptData(encryptedData, encryptionSecret);

        return {
          ...row,
          photo_url: decryptedUrl,
        };
      } catch (decryptionError) {
        console.error("Decryption Error:", decryptionError);
        return {
          ...row,
          photo_url: null,
        };
      }
    });

    return NextResponse.json(decryptedRows, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching property photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch property photos: " + error.message },
      { status: 500 }
    );
  }
}
