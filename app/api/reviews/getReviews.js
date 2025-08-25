import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function GetReviews(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { unit_id } = req.query;

  if (!unit_id) {
    return res.status(400).json({ error: "Unit ID is required" });
  }

  try {
    const query = `
        SELECT 
            r.*, 
            f.feedback_text, 
            l.landlord_id,
            ul.firstName AS landlord_first_name,
            ul.lastName AS landlord_last_name,
            ut.firstName AS tenant_first_name,
            ut.lastName AS tenant_last_name
        FROM Review r
        LEFT JOIN Feedback f ON r.id = f.review_id
        LEFT JOIN Unit u ON r.unit_id = u.unit_id
        LEFT JOIN Property p ON u.property_id = p.property_id
        LEFT JOIN Landlord l ON p.landlord_id = l.landlord_id
        LEFT JOIN User ul ON l.user_id = ul.user_id 
        LEFT JOIN Tenant t ON r.tenant_id = t.tenant_id 
        LEFT JOIN User ut ON t.user_id = ut.user_id 
        WHERE r.unit_id = ?
        ORDER BY r.created_at DESC`;

    const [reviews] = await db.execute(query, [unit_id]);

    // **Decrypt landlord & tenant names**
    const decryptedReviews = reviews.map((review) => ({
      ...review,
      landlord_first_name: review.landlord_first_name
        ? decryptData(JSON.parse(review.landlord_first_name), SECRET_KEY)
        : null,
      landlord_last_name: review.landlord_last_name
        ? decryptData(JSON.parse(review.landlord_last_name), SECRET_KEY)
        : null,
      tenant_first_name: review.tenant_first_name
        ? decryptData(JSON.parse(review.tenant_first_name), SECRET_KEY)
        : null,
      tenant_last_name: review.tenant_last_name
        ? decryptData(JSON.parse(review.tenant_last_name), SECRET_KEY)
        : null,
    }));

    console.log("Decrypted Reviews:", decryptedReviews);

    res.status(200).json(decryptedReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
