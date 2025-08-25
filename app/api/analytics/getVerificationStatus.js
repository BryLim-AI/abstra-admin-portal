import  {db} from "../../../lib/db";

export default async function getVerificationStatus(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed, ONLY fetching of records is allowed." });
    }
    try {
        const [rows] = await db.execute(`
            SELECT status, COUNT(*) AS count
            FROM PropertyVerification
            GROUP BY status
            ORDER BY count DESC;
        `);
        res.status(200).json({ verificationStatus: rows });
    } catch (error) {
        console.error("Database query error:", error);
    }
}
