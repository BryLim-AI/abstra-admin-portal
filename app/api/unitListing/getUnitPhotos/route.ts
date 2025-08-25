// app/api/unit-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unit_id = searchParams.get("unit_id");
  const encryptionSecret = process.env.ENCRYPTION_SECRET;

  if (!encryptionSecret) {
    return NextResponse.json(
      { error: "Missing encryption secret" },
      { status: 500 }
    );
  }

  try {
    let query = `SELECT * FROM UnitPhoto`;
    let params: any[] = [];

    if (unit_id) {
      query += ` WHERE unit_id = ?`;
      params.push(unit_id);
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

    return NextResponse.json(decryptedRows);
  } catch (error: any) {
    console.error("Error fetching unit photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit photos: " + error.message },
      { status: 500 }
    );
  }
}