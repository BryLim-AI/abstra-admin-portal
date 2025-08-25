import mysql from 'mysql2/promise';
import { decryptData } from '@/crypto/encrypt';

// @ts-ignore
export async function GET(req, { params }) {
  const property_id = params.property_id;

  console.log("Fetching property details for ID:", property_id);

  if (!property_id) {
    return new Response(JSON.stringify({ message: "Missing property ID" }), { status: 400 });
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: '+08:00',
    });

    const [propertyRows] = await connection.execute(
      `SELECT p.*,
              pv.occ_permit, pv.mayor_permit, pv.property_title, pv.outdoor_photo, pv.indoor_photo, pv.status AS verification_status, pv.verified
       FROM Property p
       LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
       WHERE p.property_id = ?`,
      [property_id]
    );
// @ts-ignore
    if (propertyRows.length === 0) {
      console.error("Property not found:", property_id);
      return new Response(JSON.stringify({ message: "Property not found" }), { status: 404 });
    }

    const secretKey = process.env.ENCRYPTION_SECRET;

    if (!secretKey) {
      console.error("Missing encryption secret key. Check ENCRYPTION_SECRET in .env.");
      return new Response(JSON.stringify({ message: "Encryption key missing" }), { status: 500 });
    }
// @ts-ignore
    const decryptIfValid = (data) => {
      if (!data || typeof data !== "string") return null;
      try {
        const parsedData = data.trim().startsWith("{") ? JSON.parse(data) : null;
        return parsedData ? decryptData(parsedData, secretKey) : null;
      } catch (error) {
        // @ts-ignore
        console.error("JSON Parsing Error:", error.message, "Data:", data);
        return null;
      }
    };
// @ts-ignore
    const photosArray = propertyRows[0].photos
        // @ts-ignore
      ? [...new Set(propertyRows[0].photos.split(','))]
      : [];

    const property = {
      // @ts-ignore
      ...propertyRows[0],
      // @ts-ignore
      occ_permit: decryptIfValid(propertyRows[0].occ_permit),
      // @ts-ignore
      mayor_permit: decryptIfValid(propertyRows[0].mayor_permit),
      // @ts-ignore
      property_title:decryptIfValid(propertyRows[0].property_title),
      // @ts-ignore
      outdoor_photo: decryptIfValid(propertyRows[0].outdoor_photo),
      // @ts-ignore
      indoor_photo: decryptIfValid(propertyRows[0].indoor_photo),
      photos: photosArray
    };

    return Response.json(property);

  } catch (error) {
    console.error("Error fetching property:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
