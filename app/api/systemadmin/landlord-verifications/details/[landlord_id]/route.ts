import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
export async function GET(req: NextRequest, { params }) {
  const landlordId = params.landlord_id;

  if (!landlordId) {
    return NextResponse.json({ message: "Landlord ID is required." }, { status: 400 });
  }

  try {
    const [landlordData] = await db.query<any[]>(
      `SELECT * FROM Landlord WHERE landlord_id = ?`,
      [landlordId]
    );

    const [verificationData] = await db.query<any[]>(
      `SELECT * FROM LandlordVerification WHERE landlord_id = ?`,
      [landlordId]
    );

    if (landlordData.length === 0) {
      return NextResponse.json({ message: "Landlord not found" }, { status: 404 });
    }

    const decryptedLandlordData = {
      ...landlordData[0],
      address: landlordData[0].address
        ? decryptData(JSON.parse(landlordData[0].address), process.env.ENCRYPTION_SECRET!)
        : null,
      citizenship: landlordData[0].citizenship
        ? decryptData(JSON.parse(landlordData[0].citizenship), process.env.ENCRYPTION_SECRET!)
        : null,
    };

    const decryptedVerificationData =
      verificationData.length > 0
        ? {
            ...verificationData[0],
            selfie_url: verificationData[0].selfie_url
              ? decryptData(JSON.parse(verificationData[0].selfie_url), process.env.ENCRYPTION_SECRET!)
              : null,
            document_url: verificationData[0].document_url
              ? decryptData(JSON.parse(verificationData[0].document_url), process.env.ENCRYPTION_SECRET!)
              : null,
          }
        : null;

    if (decryptedVerificationData?.selfie) {
      try {
        decryptedVerificationData.selfie = JSON.parse(decryptedVerificationData.selfie);
      } catch (error) {
        console.error("Error parsing selfie data:", error);
        decryptedVerificationData.selfie = null;
      }
    }

    if (decryptedVerificationData?.document_url) {
      try {
        const docUrl = decryptedVerificationData.document_url;
        if (typeof docUrl === "string" && docUrl.trim().startsWith("{")) {
          decryptedVerificationData.document_url = JSON.parse(docUrl);
        }
      } catch (error) {
        console.error("Error parsing document_url:", error);
        decryptedVerificationData.document_url = null;
      }
    }

    return NextResponse.json({
      landlord: decryptedLandlordData,
      verification: decryptedVerificationData,
    });
  } catch (error: any) {
    console.error("[GET Landlord Verification] DB Error:", error);
    return NextResponse.json(
      { message: "Database error", error: error.message },
      { status: 500 }
    );
  }
}
