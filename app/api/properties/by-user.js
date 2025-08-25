import mysql from "mysql2/promise";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: "Missing user_id parameter." });
    }

    let db;
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [properties] = await db.execute(`
            SELECT 
                p.property_id,
                p.property_name,
                p.property_type,
                p.street,
                p.city,
                p.province,
                p.status
            FROM Property p
            INNER JOIN Landlord l ON p.landlord_id = l.landlord_id
            WHERE l.user_id = ?
            ORDER BY p.created_at DESC
        `, [user_id]);

        return res.status(200).json(properties);

    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
