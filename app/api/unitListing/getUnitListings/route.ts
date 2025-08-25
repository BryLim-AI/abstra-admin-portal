import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const property_id = searchParams.get("property_id");
  const unit_id = searchParams.get("unit_id");

  let connection;

  try {
    connection = await db.getConnection();

    let query = `SELECT * FROM Unit WHERE 1=1`;
    const params: any[] = [];

    if (unit_id) {
      query += ` AND unit_id = ?`;
      params.push(unit_id);
    }

    if (property_id) {
      query += ` AND property_id = ?`;
      params.push(property_id);
    }

    const [rows] = await connection.execute(query, params);
// @ts-ignore
    if (unit_id && rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "No Units found for this Property" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error fetching unit listings:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch unit listings" }),
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
