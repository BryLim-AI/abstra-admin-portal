import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Property ID is required" }, { status: 400 });
  }

  try {
    const [property] = await db.execute(
        `SELECT p.* FROM Property p WHERE p.property_id = ?;`,
        [id]
    );
    // @ts-ignore
    if (!property.length) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    const [propertyPhotos] = await db.execute(
        `SELECT photo_url FROM PropertyPhoto WHERE property_id = ?;`,
        [id]
    );

    const decryptedPropertyPhotos = propertyPhotos
        // @ts-ignore
        .map((photo: any) => {
          try {
            return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
          } catch (err) {
            console.error("Decryption failed for property photo:", err);
            return null;
          }
        })
        .filter(Boolean);

    const [units] = await db.execute(
        `SELECT * FROM Unit WHERE property_id = ?;`,
        [id]
    );

    // @ts-ignore
    const unitIds = units.map((u: any) => u.unit_id).join(",") || "NULL";

    const [unitPhotos] = await db.execute(
        `SELECT unit_id, photo_url FROM UnitPhoto WHERE unit_id IN (${unitIds});`
    );

    // @ts-ignore
    const unitsWithPhotos = units.map((unit: any) => {
      const unitPhotosForThisUnit = unitPhotos
          // @ts-ignore
          .filter((photo: any) => photo.unit_id === unit.unit_id)
          .map((photo: any) => {
            try {
              return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
            } catch (err) {
              console.error("Decryption failed for unit photo:", err);
              return null;
            }
          })
          .filter(Boolean);

      return {
        ...unit,
        photos: unitPhotosForThisUnit,
        sec_deposit: unit.sec_deposit,        // added
        advanced_payment: unit.advanced_payment, // added
      };
    });

    const [paymentMethods] = await db.execute(
        `SELECT pm.method_id, m.method_name
         FROM PropertyPaymentMethod pm
                JOIN PaymentMethod m ON pm.method_id = m.method_id
         WHERE pm.property_id = ?;`,
        [id]
    );
    console.log('payment methods:', paymentMethods);

    return NextResponse.json({
      // @ts-ignore
      ...property[0],
      property_photo: decryptedPropertyPhotos,
      units: unitsWithPhotos,
      payment_methods: paymentMethods,
    });

  } catch (error) {
    console.error("Error fetching property details:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
