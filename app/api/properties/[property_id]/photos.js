import { db } from "../../../../lib/db";
import {decryptData} from "../../../../crypto/encrypt";
//  to be deleted.
export default async function UnitPhotos(req, res) {
    try {
        const { property_id } = req.query;

        if (!property_id) {
            return res.status(400).json({ message: "Missing property ID" });
        }

        const [photoRows] = await db.execute(
            `SELECT DISTINCT photo_url FROM PropertyPhoto WHERE property_id = ? ORDER BY photo_id ASC`,
            [property_id]
        );

        if (photoRows.length === 0) {
            return res.status(404).json({ message: "No photos found for this property." });
        }

        const photos = photoRows
            .map(row => decryptData(JSON.parse(row.photo_url), process.env.ENCRYPTION_SECRET))
            .filter(photo => photo !== null);

        res.status(200).json({ photos });

    } catch (error) {
        console.error("Error fetching property photos:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}