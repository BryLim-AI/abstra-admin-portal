
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";

// S3 client setup
// @ts-ignore
const s3 = new S3Client({
  region: process.env.NEXT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
  },
});

// Helper: Upload file buffer to S3
async function uploadBufferToS3(buffer: Buffer, fileName: any, contentType: any) {
  const key = `landlord-docs/${Date.now()}-${fileName}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.NEXT_S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
}

// Helper: Upload Base64 image to S3
async function uploadBase64ToS3(base64String: string) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const key = `landlord-selfies/${Date.now()}-selfie.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.NEXT_S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
      ContentEncoding: "base64",
    })
  );

  return `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
}

// Main POST route
export async function POST(req:NextRequest) {
  try {
    const formData = await req.formData();

    const landlord_id = formData.get("landlord_id");
    const documentType = formData.get("documentType");
    const selfie = formData.get("selfie");
    const uploadedFile = formData.get("uploadedFile");

    // @ts-ignore
    const address = formData.get("address")?.trim() || "";
    // @ts-ignore
    const citizenship = formData.get("citizenship")?.trim() || "";

    if (!landlord_id || !documentType || !uploadedFile || !selfie) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    const [landlordRows] = await connection.execute(
      "SELECT landlord_id FROM Landlord WHERE landlord_id = ?",
      [Number(landlord_id)]
    );

    // @ts-ignore
    if (landlordRows.length === 0) {
      return NextResponse.json({ error: "Landlord not found" }, { status: 404 });
    }

    // Upload document file
    // @ts-ignore
    const fileArrayBuffer = await uploadedFile.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    // @ts-ignore
    const fileName = uploadedFile.name.replace(/\s+/g, "_").replace(/[^\w\-_.]/g, "");
    // @ts-ignore
    const contentType = uploadedFile.type || mime.lookup(fileName) || "application/octet-stream";
    const documentUrl = await uploadBufferToS3(fileBuffer, fileName, contentType);

    // Upload selfie
    // @ts-ignore
    const selfieUrl = await uploadBase64ToS3(selfie);

    const encryptedDoc = JSON.stringify(encryptData(documentUrl, process.env.ENCRYPTION_SECRET));
    const encryptedSelfie = JSON.stringify(encryptData(selfieUrl, process.env.ENCRYPTION_SECRET));

    await connection.execute(
      `INSERT INTO LandlordVerification 
        (landlord_id, document_type, document_url, selfie_url, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [landlord_id, documentType, encryptedDoc, encryptedSelfie]
    );

    const encryptedAddress = JSON.stringify(encryptData(address, process.env.ENCRYPTION_SECRET));
    const encryptedCitizenship = JSON.stringify(encryptData(citizenship, process.env.ENCRYPTION_SECRET));

    await connection.execute(
      `UPDATE Landlord SET address = ?, citizenship = ?, updatedAt = NOW() WHERE landlord_id = ?`,
      [encryptedAddress, encryptedCitizenship, landlord_id]
    );

    await connection.commit();
    connection.release();

    return NextResponse.json({
      message: "Documents uploaded and landlord info updated",
      documentUrl,
      selfieUrl,
    });
  } catch (error) {
    console.error("[UploadDocs] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
