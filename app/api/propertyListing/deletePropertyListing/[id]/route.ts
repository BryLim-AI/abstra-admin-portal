import { db } from "@/lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

// DELETE /api/propertyListing/:id
// @ts-ignore
export async function DELETE(req: Request, { params }) {
  const { id } = params;

  let connection;

  try {
    connection = await db.getConnection();

    const [rows] = await connection.execute(
      `SELECT * FROM Property WHERE property_id = ?`,
      [id]
    );
// @ts-ignore
    if (rows.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const [activeLeases] = await connection.execute(
      `SELECT la.agreement_id 
       FROM LeaseAgreement la
       JOIN Unit u ON la.unit_id = u.unit_id
       WHERE u.property_id = ? AND la.status = 'active'`,
      [id]
    );
// @ts-ignore
    if (activeLeases.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete property with active leases" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    await connection.execute(`DELETE FROM Property WHERE property_id = ?`, [id]);

    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : null;
    if (!cookies || !cookies.token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(cookies.token, secretKey);
    const loggedUser = payload.user_id;

    await db.query(
      "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
      [loggedUser, `Deleted Property: ${id}`]
    );

    await connection.commit();
    return NextResponse.json({ message: "Property listing deleted successfully" }, { status: 200 });
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Error deleting property listing:", error);
    return NextResponse.json({ error: "Failed to delete property listing" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
