import { db } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const idList = ids.map((id) => db.escape(id)).join(",");

    const query = `UPDATE Notification SET is_read = 1 WHERE id IN (${idList})`;

    await db.query(query);

    return res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
