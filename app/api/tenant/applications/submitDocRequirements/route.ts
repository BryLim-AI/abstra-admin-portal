import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({
  region: process.env.NEXT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper to sanitize filenames
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const tenant_id = formData.get("tenant_id")?.toString();
  const unit_id = formData.get("unit_id")?.toString();
  const file = formData.get("file") as File | null;

  if (!tenant_id || !unit_id || !file) {
    return NextResponse.json(
      { message: "Missing tenant_id, unit_id, or file." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = sanitizeFilename(file.name);
    const fileName = `validId/${Date.now()}-${sanitizedName}`;

    const uploadParams = {
      Bucket: process.env.NEXT_S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const s3Url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
    const encryptedUrl = JSON.stringify(encryptData(s3Url, process.env.ENCRYPTION_SECRET!));

    const [result]: any = await db.query(
      `INSERT INTO ProspectiveTenant (tenant_id, unit_id, valid_id, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
      [tenant_id, unit_id, encryptedUrl]
    );

    return NextResponse.json({
      message: "Requirement submitted successfully!",
      prospectiveTenantId: result.insertId,
    }, { status: 201 });

  } catch (error: any) {
    console.error("[Submit Requirements] Error:", error);
    return NextResponse.json(
      { message: "Failed to submit requirements", error: error.message },
      { status: 500 }
    );
  }
}
