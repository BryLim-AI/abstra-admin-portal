
//  To be deleted, module
import { IncomingForm } from "formidable";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import { db } from "../../../lib/db";
import { decryptData, encryptData } from "../../../crypto/encrypt";

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
  },
});

// Encryption Secret
const encryptionSecret = process.env.ENCRYPTION_SECRET;

// API Config to disable default body parsing (important for Formidable)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Function to sanitize filenames, including special characters
function sanitizeFilename(filename) {
  // Replace special characters with underscores and remove whitespaces
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.]/g, "_") // Replace non-alphanumeric chars with underscores
    .replace(/\s+/g, "_"); // Replace consecutive whitespaces with a single underscore
  return sanitized;
}

export default async function handler(req, res) {
  let connection;

  try {
    connection = await db.getConnection();

    if (req.method === "POST") {
      await handlePostRequest(req, res, connection);
    } else if (req.method === "GET") {
      await handleGetRequest(req, res, connection);
    } else if (req.method === "DELETE") {
      await handleDeleteRequest(req, res, connection);
    } else {
      res.setHeader("Allow", ["POST", "GET", "DELETE"]);
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

// Handle file upload and save to S3
async function handlePostRequest(req, res, connection) {
  const form = new IncomingForm({
    multiples: true, // Allows multiple file uploads
    keepExtensions: true, // Keeps file extensions
    maxFileSize: 10 * 1024 * 1024, // 5MB limit per file
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(400).json({ error: "Error parsing form data" });
    }

    const { unit_id } = fields;
    if (!unit_id) {
      return res.status(400).json({ error: "Missing unit_id" });
    }

    const uploadedFiles = Object.values(files).flat();

    if (!uploadedFiles.length) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    try {
      await connection.beginTransaction();

      const uploadPromises = uploadedFiles.map(async (file) => {
        const filePath = file.filepath;
        const sanitizedFilename = sanitizeFilename(file.originalFilename);
        const fileName = `unitPhoto/${Date.now()}_${sanitizedFilename}`;
        const fileStream = fs.createReadStream(filePath);
        const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        // Encrypt the URL
        const encryptedUrl = JSON.stringify(
          encryptData(photoUrl, encryptionSecret)
        );

        // Upload to S3
        const uploadParams = {
          Bucket: process.env.NEXT_S3_BUCKET_NAME,
          Key: fileName,
          Body: fileStream,
          ContentType: file.mimetype,
        };

        try {
          await s3Client.send(new PutObjectCommand(uploadParams));

          return {
            unit_id,
            photo_url: encryptedUrl, // Store encrypted URL
          };
        } catch (uploadError) {
          console.error("Error uploading file to S3:", uploadError);
          throw new Error(
            `Failed to upload ${file.originalFilename}: ${uploadError.message}`
          );
        }
      });

      const uploadedFilesData = await Promise.all(uploadPromises);

      const values = uploadedFilesData.map((fileData) => [
        fileData.unit_id,
        fileData.photo_url,
        new Date(),
        new Date(),
      ]);

      const [result] = await connection.query(
        `INSERT INTO UnitPhoto (unit_id, photo_url, created_at, updated_at) VALUES ?`,
        [values]
      );

      await connection.commit();

      res.status(201).json({
        message: "Photos uploaded successfully",
        insertedPhotoIDs: result.insertId,
        files: uploadedFilesData,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error saving unit photos:", error);
      res
        .status(500)
        .json({ error: "Failed to add unit photos: " + error.message });
    }
  });
}

// Fetch unit photos
async function handleGetRequest(req, res, connection) {
  const { unit_id } = req.query;

  try {
    let query = `SELECT * FROM UnitPhoto`;
    let params = [];

    if (unit_id) {
      query += ` WHERE unit_id = ?`;
      params.push(unit_id);
    }

    const [rows] = await connection.execute(query, params);

    // Decrypt the photo URLs before returning them
    const decryptedRows = rows.map((row) => {
      try {
        const encryptedData = JSON.parse(row.photo_url);
        const decryptedUrl = decryptData(encryptedData, encryptionSecret);

        return {
          ...row,
          photo_url: decryptedUrl,
        };
      } catch (decryptionError) {
        console.error("Decryption Error:", decryptionError);
        return {
          ...row,
          photo_url: null,
        };
      }
    });

    res.status(200).json(decryptedRows);
  } catch (error) {
    console.error("Error fetching unit photos:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch unit photos: " + error.message });
  }
}

// Delete unit photo (Also delete from S3)
async function handleDeleteRequest(req, res, connection) {
  const { id } = req.query;

  try {
    const [rows] = await connection.execute(
      `SELECT photo_url FROM UnitPhoto WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Photo not found" });
    }

    let photo_url = rows[0].photo_url;

    try {
      photo_url = decryptData(JSON.parse(photo_url), encryptionSecret);
    } catch (decryptionError) {
      console.error("Decryption Error:", decryptionError);
      return res.status(500).json({ error: "Failed to decrypt photo URL." });
    }

    try {
      const key = new URL(photo_url).pathname.substring(1);

      const deleteParams = {
        Bucket: process.env.NEXT_S3_BUCKET_NAME,
        Key: key,
      };

      try {
        await s3Client.send(new DeleteObjectCommand(deleteParams));

        await connection.execute(`DELETE FROM UnitPhoto WHERE id = ?`, [id]);

        res.status(200).json({ message: "Photo deleted successfully" });
      } catch (deleteError) {
        console.error("Error deleting from S3:", deleteError);
        return res.status(500).json({
          error: "Failed to delete photo from S3: " + deleteError.message,
        });
      }
    } catch (urlError) {
      console.error("URL Error:", urlError);
      return res.status(500).json({ error: "Invalid URL after decryption." });
    }
  } catch (error) {
    console.error("Error deleting unit photo:", error);
    res
      .status(500)
      .json({ error: "Failed to delete unit photo: " + error.message });
  }
}
