import { db } from "../../../lib/db";

export default async function deleteMaintenanceRequest(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { request_id } = req.body;

    if (!request_id) {
      return res.status(400).json({ error: "Missing request_id" });
    }

    await db.query(`DELETE FROM MaintenanceRequest WHERE request_id = ?`, [
      request_id,
    ]);

    return res
      .status(200)
      .json({
        success: true,
        message: "Maintenance request deleted successfully",
      });
  } catch (error) {
    console.error("Error deleting maintenance request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
