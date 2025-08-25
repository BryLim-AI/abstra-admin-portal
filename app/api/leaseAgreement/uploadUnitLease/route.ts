import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";
import { randomUUID } from "crypto";

const encryptionSecret = process.env.ENCRYPTION_SECRET;

const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

async function bufferFile(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const formData = await req.formData();
        const unit_id = formData.get("unit_id")?.toString();

        if (!unit_id) {
            return NextResponse.json({ error: "unit_id is required" }, { status: 400 });
        }

        const file = formData.get("leaseFile") as File | null;
        if (!file) {
            return NextResponse.json({ error: "No lease file uploaded" }, { status: 400 });
        }

        await connection.beginTransaction();

        // Step 1: Try to get tenant from LeaseAgreement (status = 'pending')
        const [leaseRows] = await connection.execute(
            `SELECT agreement_id, tenant_id FROM LeaseAgreement WHERE unit_id = ? AND status = 'pending' LIMIT 1`,
            [unit_id]
        );

        let tenant_id: number | null = null;
        let agreement_id: number | null = null;
        let isFromLeaseAgreement = false;

        if ((leaseRows as any[]).length > 0) {
            tenant_id = (leaseRows as any[])[0].tenant_id;
            agreement_id = (leaseRows as any[])[0].agreement_id;
            isFromLeaseAgreement = true;
        } else {
            // Step 2: Fallback to ProspectiveTenant
            const [ptRows] = await connection.execute(
                `SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ? AND status = 'approved' LIMIT 1`,
                [unit_id]
            );

            if ((ptRows as any[]).length === 0) {
                return NextResponse.json(
                    { error: "No approved tenant found for this unit" },
                    { status: 404 }
                );
            }

            tenant_id = (ptRows as any[])[0].tenant_id;
        }

        // Step 3: Prevent duplicate active lease
        const [existingLease] = await connection.execute(
            `SELECT agreement_id FROM LeaseAgreement WHERE tenant_id = ? AND unit_id = ? AND status != 'pending'`,
            [tenant_id, unit_id]
        );

        if ((existingLease as any[]).length > 0) {
            return NextResponse.json(
                { error: "Active lease agreement already exists for this tenant and unit." },
                { status: 409 }
            );
        }

        // Step 4: Upload to S3
        const fileBuffer = await bufferFile(file);
        const sanitizedFilename = sanitizeFilename(file.name);
        const s3Key = `leaseAgreement/${Date.now()}_${randomUUID()}_${sanitizedFilename}`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: file.type,
        }));

        const s3Url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${s3Key}`;
        const encryptedUrl = JSON.stringify(encryptData(s3Url, encryptionSecret!));

        // Step 5: Insert or Update LeaseAgreement
        if (isFromLeaseAgreement && agreement_id) {
            // Update existing pending lease
            await connection.execute(
                `UPDATE LeaseAgreement 
                 SET agreement_url = ?, updated_at = NOW() 
                 WHERE agreement_id = ?`,
                [encryptedUrl, agreement_id]
            );
        } else {
            // Insert new lease record
            await connection.execute(
                `INSERT INTO LeaseAgreement (tenant_id, unit_id, agreement_url, created_at, updated_at)
                 VALUES (?, ?, ?, NOW(), NOW())`,
                [tenant_id, unit_id, encryptedUrl]
            );
        }

        await connection.commit();
        connection.release();

        return NextResponse.json({
            message: "Lease agreement uploaded successfully.",
        });
    } catch (error: any) {
        await connection.rollback();
        connection.release();
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: "Internal server error", message: error.message },
            { status: 500 }
        );
    }
}
