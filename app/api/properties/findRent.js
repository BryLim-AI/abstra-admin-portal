import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";
// to be deleted
const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { minPrice, maxPrice, searchQuery } = req.query;

  try {
    let query = `
      SELECT 
          p.property_id,
          p.property_name,
          p.city,
          p.street,
          p.province,
          pv.status AS verification_status,
          (SELECT pp.photo_url FROM PropertyPhoto pp WHERE pp.property_id = p.property_id LIMIT 1) AS encrypted_property_photo,
          MIN(u.rent_amount) AS rent_amount
      FROM Property p
      JOIN PropertyVerification pv ON p.property_id = pv.property_id
      LEFT JOIN Unit u ON p.property_id = u.property_id
      WHERE pv.status = 'Verified' AND p.status = 'active'
    `;

    const queryParams = [];

    if (minPrice || maxPrice) {
      query += ` AND u.rent_amount >= ?`;
      queryParams.push(minPrice || 0);

      if (maxPrice) {
        query += ` AND u.rent_amount <= ?`;
        queryParams.push(maxPrice);
      }
    }

    if (searchQuery) {
      query += ` AND (p.property_name LIKE ? OR p.city LIKE ? OR p.street LIKE ? OR p.province LIKE ?)`;
      const likeQuery = `%${searchQuery}%`;
      queryParams.push(likeQuery, likeQuery, likeQuery, likeQuery);
    }

    query += ` GROUP BY p.property_id;`;

    const [properties] = await db.execute(query, queryParams);

    const decryptedProperties = properties.map((property) => ({
      ...property,
      property_photo: property.encrypted_property_photo
        ? decryptData(JSON.parse(property.encrypted_property_photo), SECRET_KEY)
        : null,
    }));

    return res.status(200).json(decryptedProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
