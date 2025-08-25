import { db } from "../../../../lib/db";


export default async function getAnnouncements(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const { userType } = req.query;

        if (!userType) {
            return res.status(400).json({ message: "User type is required" });
        }

        let query = `
            SELECT id, title, message, target_audience, created_at
            FROM AdminAnnouncement
            WHERE target_audience = 'all'`;

        if (userType === "tenant") {
            query += ` OR target_audience = 'tenant'`;
        } else if (userType === "landlord") {
            query += ` OR target_audience = 'landlord'`;
        }

        query += ` ORDER BY created_at DESC`;

        const announcements = await db.query(query);

        return res.status(200).json(announcements[0] || []);
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
