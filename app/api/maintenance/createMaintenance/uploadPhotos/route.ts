import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";

const s3Client = new S3Client({
  region: process.env.NEXT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const request_id = formData.get("request_id");

  if (!request_id) {
    return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
  }

  const files: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files.push(value);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const sanitizedFilename = sanitizeFilename(file.name);
        const fileName = `maintenancePhoto/${Date.now()}_${sanitizedFilename}`;
        const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
        const encryptedUrl = JSON.stringify(encryptData(photoUrl, encryptionSecret));

        const uploadParams = {
          Bucket: process.env.NEXT_S3_BUCKET_NAME!,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        return {
          request_id,
          photo_url: encryptedUrl,
        };
      })
    );

    const values = uploadResults.map((data) => [
      data.request_id,
      data.photo_url,
      new Date(),
      new Date(),
    ]);

    const [insertResult] = await connection.query(
      `INSERT INTO MaintenancePhoto (request_id, photo_url, created_at, updated_at) VALUES ?`,
      [values]
    );

    await connection.commit();


      return NextResponse.json(
      {
        message: "Maintenance Photos uploaded successfully",
          // @ts-ignore
        insertedPhotoIDs: insertResult.insertId,
        files: uploadResults,
      },
      { status: 201 }
    );
  } catch (error: any) {
    await connection.rollback();
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  } finally {
    connection.release?.();
  }
}
