import { db } from "@/lib/db";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.NEXT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(req: NextRequest) {
  const unit_id = req.nextUrl.searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json({ error: "unit_id is required" }, { status: 400 });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [tenantRows] = await connection.execute(
      "SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ? AND status = 'approved' LIMIT 1",
      [unit_id]
    );

    // @ts-ignore
    if (!tenantRows || tenantRows.length === 0) {
      return NextResponse.json(
        { error: "No approved tenant found for this unit" },
        { status: 404 }
      );
    }

    // @ts-ignore
    const tenant_id = tenantRows[0].tenant_id;

    const [leaseRows] = await connection.execute(
      "SELECT agreement_url, agreement_id FROM LeaseAgreement WHERE unit_id = ? AND tenant_id = ?",
      [unit_id, tenant_id]
    );

    // @ts-ignore
    if (!leaseRows || leaseRows.length === 0) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    let leaseFileUrl: string;

    try {
      // @ts-ignore
      leaseFileUrl = decryptData(
          // @ts-ignore
          JSON.parse(leaseRows[0].agreement_url),
        process.env.ENCRYPTION_SECRET!
      );
    } catch (decryptionError) {
      console.error("Decryption Error:", decryptionError);
      return NextResponse.json(
        { error: "Failed to decrypt lease file URL." },
        { status: 500 }
      );
    }

    const s3Key = new URL(leaseFileUrl).pathname.substring(1);

    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.NEXT_S3_BUCKET_NAME!,
          Key: s3Key,
        })
      );
    } catch (s3Error) {
      console.error("S3 Deletion Error:", s3Error);
      return NextResponse.json(
        { error: "Failed to delete lease file from S3." },
        { status: 500 }
      );
    }

    const [deleteResult] = await connection.execute(
      "DELETE FROM LeaseAgreement WHERE agreement_id = ?",
        // @ts-ignore

        [leaseRows[0].agreement_id]
    );

    // @ts-ignore
    if (deleteResult.affectedRows === 0) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    await connection.execute(
      "UPDATE ProspectiveTenant SET status = 'pending' WHERE tenant_id = ? AND unit_id = ?",
      [tenant_id, unit_id]
    );

    await connection.execute(
      "UPDATE Unit SET status = 'unoccupied' WHERE unit_id = ?",
      [unit_id]
    );

    await connection.commit();
    connection.release();

    return NextResponse.json({
      message: "Lease agreement and related data deleted successfully",
    });
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Error deleting lease:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
