import { db } from '@/lib/db';
import { decryptData } from '@/crypto/encrypt';
// @ts-ignore
export async function GET(req, { params }) {
  const { property_id } = params;

  if (!property_id) {
    return new Response(JSON.stringify({ message: "Missing property ID" }), {
      status: 400,
    });
  }

  try {
    const [photoRows] = await db.execute(
      `SELECT DISTINCT photo_url FROM PropertyPhoto WHERE property_id = ? ORDER BY photo_id ASC`,
      [property_id]
    );
// @ts-ignore
    if (!photoRows || photoRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "No photos found for this property." }),
        { status: 404 }
      );
    }

    const secretKey = process.env.ENCRYPTION_SECRET;

    const photos = photoRows
        // @ts-ignore
      .map((row) => {
        try {
          return decryptData(JSON.parse(row.photo_url), secretKey);
        } catch (err) {
          console.error("Decryption error:", err);
          return null;
        }
      })
        // @ts-ignore
      .filter((photo) => photo !== null);

    return Response.json({ photos });
  } catch (error) {
    console.error("Error fetching property photos:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
