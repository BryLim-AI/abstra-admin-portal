import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { decryptData, encryptData } from "@/crypto/encrypt";

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

// POST Upload Photos
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const property_id = formData.get("property_id")?.toString();

  if (!property_id) {
    return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
  }

  const files = formData.getAll("files");
  console.log('file', files)
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const uploadedFilesData = await Promise.all(
      files.map(async (file: any) => {
        if (typeof file === "string") return null;

        const buffer = Buffer.from(await file.arrayBuffer());
        const sanitizedFilename = sanitizeFilename(file.name);
        const fileName = `propertyPhoto/${Date.now()}_${sanitizedFilename}`;
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
          property_id,
          photo_url: encryptedUrl,
          created_at: new Date(),
          updated_at: new Date(),
        };
      })
    );

    const values = uploadedFilesData
      .filter(Boolean)
        // @ts-ignore
      .map((data) => [data.property_id, data.photo_url, data.created_at, data.updated_at]);

    const [result] = await connection.query(
      `INSERT INTO PropertyPhoto (property_id, photo_url, created_at, updated_at)
       VALUES ?`,
      [values]
    );

    await connection.commit();
    return NextResponse.json({
      message: "Photos uploaded successfully",
      // @ts-ignore
      insertedPhotoIDs: result.insertId,
      files: uploadedFilesData,
    });
  } catch (err: any) {
    await connection.rollback();
    console.error("Upload Error:", err);
    return NextResponse.json(
      { error: "Failed to upload property photos: " + err.message },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// GET List Photos
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const property_id = searchParams.get("property_id");

  const connection = await db.getConnection();
  try {
    let query = `SELECT * FROM PropertyPhoto`;
    const params: any[] = [];

    if (property_id) {
      query += ` WHERE property_id = ?`;
      params.push(property_id);
    }

    const [rows] = await connection.execute(query, params);
// @ts-ignore
    const decryptedRows = rows.map((row: any) => {
      try {
        const encryptedData = JSON.parse(row.photo_url);
        const decryptedUrl = decryptData(encryptedData, encryptionSecret);
        return { ...row, photo_url: decryptedUrl };
      } catch (e) {
        return { ...row, photo_url: null };
      }
    });

    return NextResponse.json(decryptedRows);
  } catch (err: any) {
    console.error("GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch property photos: " + err.message },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// DELETE Photo
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const photo_id = searchParams.get("photo_id");

  if (!photo_id) {
    return NextResponse.json({ error: "Missing photo_id" }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT photo_url FROM PropertyPhoto WHERE photo_id = ?`,
      [photo_id]
    );
// @ts-ignore
    if (rows.length === 0) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }
// @ts-ignore
    const encryptedUrl = JSON.parse(rows[0].photo_url);
    const photoUrl = decryptData(encryptedUrl, encryptionSecret);
    // @ts-ignore
    const key = new URL(photoUrl).pathname.slice(1);

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.NEXT_S3_BUCKET_NAME!,
        Key: key,
      })
    );

    await connection.execute(`DELETE FROM PropertyPhoto WHERE photo_id = ?`, [photo_id]);
    return NextResponse.json({ message: "Photo deleted successfully" });
  } catch (err: any) {
    console.error("DELETE Error:", err);
    return NextResponse.json(
      { error: "Failed to delete property photo: " + err.message },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
