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

        const [subscriptions] = await db.execute(`
            SELECT
                s.subscription_id,
                s.plan_name,
                s.start_date,
                s.end_date,
                s.payment_status,
                s.amount_paid,
                s.created_at,
                s.updated_at,
                s.is_active
            FROM Subscription s
                     INNER JOIN Landlord l ON s.landlord_id = l.landlord_id
            WHERE l.user_id = ?
            ORDER BY s.start_date DESC
        `, [user_id]);

        return res.status(200).json(subscriptions);

    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
