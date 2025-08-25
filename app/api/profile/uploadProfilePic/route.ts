import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";
import { encryptData } from "@/crypto/encrypt";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;

        if (!token) {
            console.error("[Profile Upload] No valid token found.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.user_id;

        if (!userId) {
            console.error("[Profile Upload] Invalid JWT payload.");
            return NextResponse.json({ error: "Invalid user session." }, { status: 400 });
        }

        console.log(`[Profile Upload] Authenticated User ID: ${userId}`);

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file || typeof file === "string") {
            return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `profile-pictures/${Date.now()}-${file.name}`;

        const uploadParams = {
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        const imageUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
        const encryptedImage = imageUrl ? JSON.stringify(encryptData(imageUrl, process.env.ENCRYPTION_SECRET!)) : null;

        console.log(`[Profile Upload] File Uploaded to S3: ${imageUrl}`);

        await db.query("UPDATE User SET profilePicture = ? WHERE user_id = ?", [encryptedImage, userId]);
        await db.query(
            "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
            [userId, "Uploaded Profile Picture"]
        );

        console.log(`[Profile Upload] Profile picture updated in DB for User ID: ${userId}`);

        return NextResponse.json({ message: "Profile picture updated successfully!", imageUrl });
    } catch (error) {
        console.error("[Profile Upload] Error:", error);
        return NextResponse.json({ message: "Failed to upload image" }, { status: 500 });
    }
}
