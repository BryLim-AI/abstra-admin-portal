import { db } from "../../../lib/db";
//  to be modularized, deleted
export default async function leaseDetails(req, res) {
  const { unit_id } = req.query;
  let connection;

  try {
    connection = await db.getConnection();
    if (req.method === "GET") {
      await handleGetRequest(req, res, connection, unit_id);
    } else if (req.method === "PUT") {
      await handlePutRequest(req, res, connection, unit_id);
    } else if (req.method === "DELETE") {
      await handleDeleteRequest(req, res, connection, unit_id);
    } else {
      res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
async function handleDeleteRequest(req, res, connection, unit_id) {
  try {
    const [tenantRows] = await connection.execute(
      "SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ? AND status = 'approved' LIMIT 1",
      [unit_id]
    );

    if (tenantRows.length === 0) {
      return res
        .status(404)
        .json({ error: "No approved tenant found for this unit" });
    }

    const tenant_id = tenantRows[0].tenant_id;

    await connection.beginTransaction();

    const [deleteResult] = await connection.execute(
      `DELETE FROM LeaseAgreement WHERE unit_id = ? AND tenant_id = ?`,
      [unit_id, tenant_id]
    );

    await connection.commit();

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Lease agreement not found" });
    }

    res.status(200).json({ message: "Lease Agreement deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting lease agreement:", error);

    res.status(500).json({ error: "Failed to delete lease agreement" });
  }
}

async function handleGetRequest(req, res, connection, unit_id) {
  try {
    const [tenantRows] = await connection.execute(
      "SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ? AND status = 'approved' LIMIT 1",
      [unit_id]
    );

    if (tenantRows.length === 0) {
      return res
        .status(404)
        .json({ error: "No approved tenant found for this unit" });
    }

    const tenant_id = tenantRows[0].tenant_id;

    const [rows] = await connection.execute(
      "SELECT * FROM LeaseAgreement WHERE unit_id = ? AND tenant_id = ?",
      [unit_id, tenant_id]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching property/unit listings:", error);
  }
}

async function handlePutRequest(req, res, connection, unit_id) {
  try {
    const { start_date, end_date } = req.body;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate <= startDate) {
      return res
        .status(400)
        .json({ error: "End date must be after the start date" });
    }

    const [tenantRows] = await connection.execute(
      "SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ? AND status = 'approved' LIMIT 1",
      [unit_id]
    );

    if (tenantRows.length === 0) {
      return res
        .status(404)
        .json({ error: "No approved tenant found for this unit" });
    }

    const tenant_id = tenantRows[0].tenant_id;

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `UPDATE LeaseAgreement SET start_date = ?, end_date = ?, status = 'active' WHERE unit_id = ? and tenant_id = ?`,
      [start_date, end_date, unit_id, tenant_id]
    );
    await connection.commit();

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "No lease agreement found to update" });
    }

    res
      .status(200)
      .json({ message: "Lease updated successfully", start_date, end_date });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating lease:", error);
    res.status(500).json({ error: "Failed to update lease" });
  }
}

