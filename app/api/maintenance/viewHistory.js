import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: "Tenant ID is required" });
  }

  try {
    const [history] = await db.query(
      `SELECT 
        mr.request_id, 
        mr.subject, 
        mr.description, 
        mr.schedule_date, 
        mr.completion_date, 
        mr.category, 
        p.property_name, 
        u.unit_name,
        GROUP_CONCAT(mp.photo_url) AS maintenance_photos
      FROM MaintenanceRequest mr
      JOIN Unit u ON mr.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      LEFT JOIN MaintenancePhoto mp ON mr.request_id = mp.request_id
      WHERE mr.tenant_id = ? AND mr.status = 'Completed'
      GROUP BY mr.request_id, p.property_name, u.unit_name
      ORDER BY mr.completion_date DESC`,
      [tenant_id]
    );

    const maintenanceHistory = history.map((request) => {
      return {
        ...request,
        maintenance_photos: request.maintenance_photos
          ? [decryptData(JSON.parse(request.maintenance_photos), SECRET_KEY)]
          : [],
      };
    });

    res.status(200).json(maintenanceHistory);
  } catch (error) {
    console.error("Error fetching maintenance history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
