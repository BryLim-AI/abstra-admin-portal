import { IncomingForm } from "formidable";
import fs from "fs";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { encryptData, decryptData } from "../../../crypto/encrypt";
import { db } from "../../../lib/db";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

function sanitizeFilename(filename) {
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.]/g, "_")
    .replace(/\s+/g, "_");
  return sanitized;
}

export default async function handler(req, res) {
  let connection;

  try {
    connection = await db.getConnection();

    if (req.method === "GET") {
      await getPropertyPhotos(req, res, connection);
    } else if (req.method === "PUT") {
      await handleUpdatePhotos(req, res, connection);
    } else if (req.method === "DELETE") {
      await handleDeletePhoto(req, res, connection);
    } else {
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function getPropertyPhotos(req, res, connection) {
  const { property_id } = req.query;

  if (!property_id) {
    return res.status(400).json({ error: "Missing property_id" });
  }

  try {
    const [result] = await connection.query(
        `SELECT photo_url FROM PropertyPhoto WHERE property_id = ?`,
        [property_id]
    );


    let photos = [];
    if (result.length > 0 && result[0].photo_url) {
      try {
        const encryptedPhotos = JSON.parse(result[0].photo_url);
        photos = encryptedPhotos.map((photo) =>
          decryptData(JSON.parse(photo), process.env.ENCRYPTION_SECRET)
        );
      } catch (error) {
        console.error("Error decrypting photos:", error);
      }
    }

    res.status(200).json({ photos });
  } catch (error) {
    console.error("Error fetching property photos:", error);
    res.status(500).json({ error: "Failed to fetch property photos" });
  }
}

async function handleUpdatePhotos(req, res, connection) {
  const form = new IncomingForm({
    multiples: true,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Error parsing form data" });
    }

    console.log("Error from form.parse:", err);
    console.log("Fields from form.parse:", fields);
    console.log("Files from form.parse:", files);

    const { property_id } = fields;
    if (!property_id) {
      return res.status(400).json({ error: "Missing property_id" });
    }

    const uploadedFiles = Array.isArray(files.photos)
      ? files.photos
      : [files.photos];

    try {
      await connection.beginTransaction();

      const [existingProperty] = await connection.query(
        `SELECT photo_url FROM PropertyPhoto WHERE property_id = ?`,
        [property_id]
      );

      let existingPhotos = [];
      if (existingProperty.length > 0 && existingProperty[0].photo_url) {
        try {
          existingPhotos = JSON.parse(existingProperty[0].photo_url);
        } catch (error) {
          console.error("Error parsing existing photo URLs:", error);
        }
      }

      const uploadPromises = uploadedFiles.map(async (file) => {
        const filePath = file.filepath;
        const sanitizedFilename = sanitizeFilename(file.originalFilename);
        const fileName = `propertyPhoto/${Date.now()}_${sanitizedFilename}`;
        const fileStream = fs.createReadStream(filePath);
        const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        const encryptedUrl = JSON.stringify(
          encryptData(photoUrl, process.env.ENCRYPTION_SECRET)
        );

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME,
            Key: fileName,
            Body: fileStream,
            ContentType: file.mimetype,
          })
        );

        return encryptedUrl;
      });

      const newPhotoUrls = await Promise.all(uploadPromises);
      const updatedPhotos = [...existingPhotos, ...newPhotoUrls];

      await connection.query(
        `UPDATE PropertyPhoto SET photo_url = ?, updated_at = ? WHERE property_id = ?`,
        [JSON.stringify(updatedPhotos), new Date(), property_id]
      );

      await connection.commit();
      res.status(200).json({
        message: "Property photos updated successfully",
        photos: updatedPhotos,
      });
    } catch (error) {
      await connection.rollback();
      res
        .status(500)
        .json({ error: "Failed to update property photos: " + error.message });
    }
  });
}

async function handleDeletePhoto(req, res, connection) {
  const { property_id, photo_url } = req.query;

  if (!property_id || !photo_url) {
    return res.status(400).json({ error: "Missing property_id or photo_url" });
  }

  try {
    await connection.beginTransaction();

    const [existingProperty] = await connection.query(
      `SELECT photo_url FROM PropertyPhoto WHERE property_id = ?`,
      [property_id]
    );

    if (!existingProperty.length) {
      return res.status(404).json({ error: "Property not found" });
    }

    let existingPhotos = JSON.parse(existingProperty[0].photo_url);
    const decryptedUrls = existingPhotos.map((photo) =>
      decryptData(JSON.parse(photo), process.env.ENCRYPTION_SECRET)
    );

    if (!decryptedUrls.includes(photo_url)) {
      return res
        .status(404)
        .json({ error: "Photo not found in property listing" });
    }

    const updatedPhotos = existingPhotos.filter(
      (photo) =>
        decryptData(JSON.parse(photo), process.env.ENCRYPTION_SECRET) !==
        photo_url
    );

    await connection.query(
      `UPDATE PropertyPhoto SET photo_url = ? WHERE property_id = ?`,
      [JSON.stringify(updatedPhotos), property_id]
    );

    const key = photo_url.split(".com/")[1];

    await s3Client.send(
      new DeleteObjectCommand({ Bucket: process.env.NEXT_S3_BUCKET_NAME, Key: key })
    );

    await connection.commit();
    res.status(200).json({ message: "Photo deleted successfully" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: "Failed to delete photo: " + error.message });
  }
}
