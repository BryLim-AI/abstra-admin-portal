import { db } from "../../../../lib/db";
//  to be deleted.
export default async function getPropertiesDetails(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const { id } = req.query;

    const [rows] = await connection.execute(
      "SELECT property_id, property_name FROM Property WHERE property_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
