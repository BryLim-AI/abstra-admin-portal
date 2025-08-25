import { NextRequest } from "next/server";
import mysql from "mysql2/promise";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
        return new Response(JSON.stringify({ error: "User ID is required" }), {
            status: 400,
        });
    }

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [rows] = await connection.query(
            "SELECT is_2fa_enabled FROM User WHERE user_id = ?",
            [user_id]
        );

        if (rows.length === 0) {
            return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
            });
        }

        return new Response(
            JSON.stringify({ is2FAEnabled: !!rows[0].is_2fa_enabled }),
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error("Error fetching 2FA status:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
        });
    } finally {
        if (connection) await connection.end();
    }
}
