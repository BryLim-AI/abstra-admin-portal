import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";

const s3Client = new S3Client({
  region: process.env.NEXT_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const unit_id = formData.get("unit_id") as string;

  if (!unit_id) {
    return NextResponse.json({ error: "Missing unit_id" }, { status: 400 });
  }

  const files: File[] = [];
  for (const entry of formData.entries()) {
    if (entry[1] instanceof File) files.push(entry[1]);
  }

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const uploadedFilesData = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const sanitizedFilename = sanitizeFilename(file.name);
        const fileName = `unitPhoto/${Date.now()}_${sanitizedFilename}`;
        const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;

        const encryptedUrl = JSON.stringify(
          encryptData(photoUrl, encryptionSecret)
        );

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
          })
        );

        return {
          unit_id,
          photo_url: encryptedUrl,
        };
      })
    );

    const values = uploadedFilesData.map((file) => [
      file.unit_id,
      file.photo_url,
      new Date(),
      new Date(),
    ]);

    const [result] = await connection.query(
      `INSERT INTO UnitPhoto (unit_id, photo_url, created_at, updated_at) VALUES ?`,
      [values]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Photos uploaded successfully",
      insertedPhotoIDs: (result as any).insertId,
      files: uploadedFilesData,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error saving unit photos:", error);
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
