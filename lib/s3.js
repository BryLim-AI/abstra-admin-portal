import AWS from "aws-sdk";

// ✅ Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// ✅ Function to Delete File from S3
export const deleteFromS3 = async (fileUrl) => {
    try {
        if (!fileUrl) return;

        // Extract bucket name and key from URL
        const bucketName = process.env.NEXT_S3_BUCKET_NAME;
        const key = fileUrl.split(".amazonaws.com/")[1];

        console.log("📂 Deleting from S3:", key);

        await s3.deleteObject({ Bucket: bucketName, Key: key }).promise();

        console.log("✅ Successfully deleted:", fileUrl);
    } catch (error) {
        console.error("❌ S3 Delete Error:", error);
    }
};
