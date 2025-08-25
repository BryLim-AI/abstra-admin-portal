import { db } from "../../../lib/db";

export default async function submitReview(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tenant_id, rating, review_text } = req.body;

  if (!tenant_id || !rating || !review_text) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT unit_id FROM ProspectiveTenant WHERE tenant_id = ?`,
      [tenant_id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No approved unit found for this tenant" });
    }

    const unit_id = rows[0].unit_id;

    await db.execute(
      `INSERT INTO Review (tenant_id, unit_id, rating, review_text, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [tenant_id, unit_id, rating, review_text]
    );

    res.status(201).json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
