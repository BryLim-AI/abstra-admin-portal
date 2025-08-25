import {db} from "../../../../lib/db";
import {decryptData } from "../../../../crypto/encrypt";


export default async function getLandlordVerificationData(req, res) {
    const { landlord_id } = req.query;

    if (req.method === "GET") {
        try {
            const [landlordData] = await db.query(
                `SELECT * FROM Landlord WHERE landlord_id = ?`,
                [landlord_id]
            );

            const [verificationData] = await db.query(
                `SELECT * FROM LandlordVerification WHERE landlord_id = ?`,
                [landlord_id]
            );

            if (landlordData.length === 0) {
                return res.status(404).json({ message: "Landlord not found" });
            }

            const decryptedLandlordData = {
                ...landlordData[0],
                address: landlordData[0].address
                    ? decryptData(JSON.parse(landlordData[0].address), process.env.ENCRYPTION_SECRET)
                    : null,
                citizenship: landlordData[0].citizenship
                    ? decryptData(JSON.parse(landlordData[0].citizenship), process.env.ENCRYPTION_SECRET)
                    : null,
            };

            // Decrypt verification data
            const decryptedVerificationData = verificationData.length > 0
                ? {
                    ...verificationData[0],
                    selfie_url: verificationData[0].selfie_url
                        ? decryptData(JSON.parse(verificationData[0].selfie_url), process.env.ENCRYPTION_SECRET)
                        : null,
                    document_url: verificationData[0].document_url
                        ? decryptData(JSON.parse(verificationData[0].document_url), process.env.ENCRYPTION_SECRET)
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
                console.log("Raw decrypted document_url:", decryptedVerificationData.document_url); // Debugging line

                try {
                    // Check if document_url is a JSON string or a plain URL
                    if (
                        typeof decryptedVerificationData.document_url === "string" &&
                        decryptedVerificationData.document_url.trim().startsWith("{")
                    ) {
                        decryptedVerificationData.document_url = JSON.parse(decryptedVerificationData.document_url);
                    }
                } catch (error) {
                    console.error("Error parsing document_url data:", error);
                    decryptedVerificationData.document_url = null;
                }
            }

            res.status(200).json({
                landlord: decryptedLandlordData,
                verification: decryptedVerificationData,
            });

        } catch (error) {
            console.error("Database Error:", error);
            res.status(500).json({ message: "Database connection error", error: error.message });
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
