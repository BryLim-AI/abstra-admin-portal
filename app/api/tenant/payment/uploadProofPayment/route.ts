import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

// S3 config
const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const unit_id = formData.get("unit_id")?.toString();
        const tenant_id = formData.get("tenant_id")?.toString();
        const agreement_id = formData.get("agreement_id")?.toString();
        const amount_paid = formData.get("amount_paid")?.toString();

        console.log("Incoming form data:", {
            file: file?.name,
            unit_id,
            tenant_id,
            agreement_id,
            amount_paid,
        });

        // Validate
        if (!file || !unit_id || !tenant_id || !agreement_id || !amount_paid) {
            return NextResponse.json(
                { message: "Missing required fields." },
                { status: 400 }
            );
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split(".").pop();
        const key = `payment_proofs/${randomUUID()}.${fileExtension}`;

        const uploadParams = new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: key,
            Body: fileBuffer,
            ContentType: file.type,
        });

        await s3.send(uploadParams);

        const fileUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;

        // Save to DB
        await db.query(
            `
                INSERT INTO Payment (
                    agreement_id,
                    payment_type,
                    amount_paid,
                    payment_method_id,
                    payment_status,
                    proof_of_payment,
                    created_at,
                    updated_at
                ) VALUES (?, 'initial_payment', ?, ?, 'pending', ?, NOW(), NOW())
            `,
            [
                agreement_id,
                parseFloat(amount_paid),
                5, // payment_method_id = 2 (Manual Upload)
                fileUrl,
            ]
        );

        return NextResponse.json({
            message: "Proof uploaded successfully",
            fileUrl,
        });
    } catch (err) {
        console.error("Upload/DB error:", err);
        return NextResponse.json(
            { message: "Upload or DB save failed", error: String(err) },
            { status: 500 }
        );
    }
}
