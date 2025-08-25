import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { decryptData } from "@/crypto/encrypt";
import { deleteFromS3 } from "@/lib/s3";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function DELETE(req: Request) {
    try {
        const { photo_id, property_id } = await req.json();

        if (!photo_id || !property_id) {
            return NextResponse.json({ error: "photo_id and property_id are required" }, { status: 400 });
        }

        // Get the encrypted URL from DB
        const [rows] = await db.query(
            "SELECT photo_url FROM PropertyPhoto WHERE photo_id = ? AND property_id = ?",
            [photo_id, property_id]
        );

        // @ts-ignore
        if (!rows.length) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        // @ts-ignore
        const encryptedUrl = rows[0].photo_url;

        // Decrypt the URL
        let decryptedUrl: string;
        try {
            // @ts-ignore
            decryptedUrl = decryptData(JSON.parse(encryptedUrl), encryptionSecret);
        } catch (err) {
            console.error("Failed to decrypt URL:", err);
            return NextResponse.json({ error: "Failed to decrypt photo URL" }, { status: 500 });
        }

        // Delete the file from S3
        await deleteFromS3(decryptedUrl);

        // Delete from DB
        await db.query("DELETE FROM PropertyPhoto WHERE photo_id = ? AND property_id = ?", [photo_id, property_id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete photo:", error);
        return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
    }
}
