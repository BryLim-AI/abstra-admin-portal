import mysql from "mysql2/promise";


export default async function VerificationStatusLandlord(req, res) {
    const { user_id } = req.query;

    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        // Fetch landlord_id and is_verified status directly
        const [rows] = await db.execute(
            `SELECT landlord_id, is_verified FROM Landlord WHERE user_id = ?`,
            [user_id]
        );

        if (rows.length === 0) {
            await db.end();
            return res.status(404).json({ message: "Landlord not found" });
        }

        const { is_verified } = rows[0];

        const verificationStatus = is_verified === 1 ? "verified" : "not verified";

        await db.end();
        return res.status(200).json({
            verification_status: verificationStatus,
        });

    } catch (error) {
        console.error("Database Error:", error);
        await db.end();
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

