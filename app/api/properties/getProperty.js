import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";
// to be deleted
const SECRET_KEY = process.env.ENCRYPTION_SECRET; // Store in .env

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Property ID is required" });

  try {
    // ✅ Fetch property details
    let query = `
      SELECT 
        p.*
      FROM Property p
      WHERE p.property_id = ?;
    `;
    const [property] = await db.execute(query, [id]);
    if (!property.length)
      return res.status(404).json({ message: "Property not found" });

    // ✅ Fetch property photos (all photos)
    let propertyPhotosQuery = `
      SELECT photo_url FROM PropertyPhoto WHERE property_id = ?;
    `;
    const [propertyPhotos] = await db.execute(propertyPhotosQuery, [id]);

    // 🔑 Decrypt all property photos
    let decryptedPropertyPhotos = propertyPhotos
      .map((photo) => {
        try {
          return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
        } catch (err) {
          console.error("Decryption failed for property photo:", err);
          return null;
        }
      })
      .filter(Boolean); // Remove failed decryptions

    // ✅ Fetch units associated with the property
    let unitsQuery = `SELECT * FROM Unit WHERE property_id = ?;`;
    const [units] = await db.execute(unitsQuery, [id]);

    // ✅ Fetch unit photos (Prevent malformed SQL if no units exist)
    let unitPhotosQuery = `
      SELECT unit_id, photo_url FROM UnitPhoto WHERE unit_id IN (${
        units.length ? units.map((u) => u.unit_id).join(",") : "NULL"
      });
    `;
    const [unitPhotos] = await db.execute(unitPhotosQuery);

    // 🔗 Attach and decrypt photos for respective units
    const unitsWithPhotos = units.map((unit) => {
      const unitPhotosForThisUnit = unitPhotos
        .filter((photo) => photo.unit_id === unit.unit_id)
        .map((photo) => {
          try {
            return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
          } catch (err) {
            console.error("Decryption failed for unit photo:", err);
            return null;
          }
        })
        .filter(Boolean);

      return { ...unit, photos: unitPhotosForThisUnit };
    });

    return res.status(200).json({
      ...property[0],
      property_photo: decryptedPropertyPhotos,
      units: unitsWithPhotos,
    });
  } catch (error) {
    console.error("Error fetching property details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
