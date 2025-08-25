import  {db} from "../../../lib/db";

export default async function getPropertyTypes(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed, ONLY fetching of records is allowed." });
    }
    try {
        const [rows] = await db.execute(`
            SELECT property_type AS type, COUNT(*) AS count
            FROM Property
            GROUP BY property_type
            ORDER BY count DESC;
        `);
        res.status(200).json({ propertyTypes: rows });
    } catch (error) {
        console.error("Database query failed:", error.message);
    }
}
