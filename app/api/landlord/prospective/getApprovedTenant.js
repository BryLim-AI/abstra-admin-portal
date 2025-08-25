import { decryptData } from "../../../../crypto/encrypt";
import { db } from "../../../../lib/db";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { unit_id } = req.query;

  if (!unit_id) {
    return res.status(400).json({ message: "unit_id is required" });
  }

  try {
    const [prospectiveTenant] = await db.execute(
      `SELECT * FROM ProspectiveTenant 
              WHERE unit_id = ? AND status = 'approved' 
              ORDER BY created_at ASC LIMIT 1`,
      [unit_id]
    );

    if (prospectiveTenant.length === 0) {
      return res
        .status(404)
        .json({ message: "No prospective tenants found for this unit" });
    }

    const tenantData = prospectiveTenant[0];

    const [tenant] = await db.execute(
      `SELECT tenant_id, user_id, occupation, employment_type, monthly_income 
              FROM Tenant WHERE tenant_id = ?`,
      [tenantData.tenant_id]
    );

    if (tenant.length === 0) {
      return res.status(404).json({ message: "Tenant details not found" });
    }

    const [user] = await db.execute(
      `SELECT firstName, lastName, email, birthDate FROM User WHERE user_id = ?`,
      [tenant[0].user_id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "User details not found" });
    }

    const decryptedUser = {
      firstName: decryptData(JSON.parse(user[0].firstName), SECRET_KEY),
      lastName: decryptData(JSON.parse(user[0].lastName), SECRET_KEY),
      email: decryptData(JSON.parse(user[0].email), SECRET_KEY),
      birthDate: decryptData(JSON.parse(user[0].birthDate), SECRET_KEY),
    };

    return res.status(200).json({
      prospectiveTenant: tenantData,
      tenant: tenant[0],
      user: decryptedUser,
    });
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
