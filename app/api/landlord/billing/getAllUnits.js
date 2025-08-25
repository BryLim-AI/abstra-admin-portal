import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  const { unit_id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {

    const [unitResult] = await db.execute(
      `SELECT * FROM Unit WHERE unit_id = ?`,
      [unit_id]
    );

    if (unitResult.length === 0) {
      return res.status(404).json({ error: "Unit not found" });
    }

    const unit = unitResult[0];

    const [propertyResult] = await db.execute(
      `SELECT * FROM Property WHERE property_id = ?`,
      [unit.property_id]
    );

    const property = propertyResult.length > 0 ? propertyResult[0] : null;

    res.status(200).json({ unit, property });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
