import {
  decryptData,
  encryptData,
} from "../../../crypto/encrypt";
import { db } from "../../../lib/db";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = "./public/uploads";
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename
  },
});
// Initialize multer with some settings like file size limit and file type filter
const upload = multer({
  storage, // Use the storage configuration
  limits: { fileSize: 30 * 1024 * 1024 }, // Limit the file size to 30MB
  fileFilter: (req, file, cb) => {
    // Allow only images (jpeg, png, jpg)
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // File type is valid
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG are allowed."), false); // Invalid file type
    }
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    // Fetch user data
    try {
      const [rows] = await db.execute("SELECT * FROM User WHERE user_id = ?", [
        id,
      ]);
      if (!rows.length)
        return res.status(404).json({ error: "User not found" });

      const user = rows[0];
      const userType = user.userType; // Get the user type (landlord or tenant)
      let profilePicturePath = null;
      let landlordId = null;
      let verificationStatus = "not verified";
      // Depending on the user type, query the respective table for the profile picture
      if (userType === "landlord") {

        // Get the profile picture from the landlords table
        const [landlordRows] = await db.execute(
          "SELECT landlord_id, profilePicture, verified FROM Landlord WHERE user_id = ?",
          [id]
        );

        if (landlordRows.length) {
          profilePicturePath = landlordRows[0].profilePicture;
          landlordId = landlordRows[0].landlord_id;
          verificationStatus = landlordRows[0].verified ? "approved" : "not verified";

          const [verificationRows] = await db.execute(
              "SELECT status FROM LandlordVerification WHERE landlord_id = ? ORDER BY created_at DESC LIMIT 1",
              [landlordId]
          );
          if (verificationRows.length) {
            verificationStatus = verificationRows[0].status;
          }
        }
      } else if (userType === "tenant") {
        // Get the profile picture from the tenants table
        const [tenantRows] = await db.execute(
          "SELECT profilePicture FROM Tenant WHERE user_id = ?",
          [id]
        );

        if (tenantRows.length) {
          profilePicturePath = tenantRows[0].profilePicture;
        }
      }

      await res.status(200).json({
        firstName: decryptData(JSON.parse(user.firstName), process.env.ENCRYPTION_SECRET),
        lastName: decryptData(JSON.parse(user.lastName), process.env.ENCRYPTION_SECRET),
        email: decryptData(JSON.parse(user.email), process.env.ENCRYPTION_SECRET),
        phoneNumber: decryptData(user.phoneNumber),
        birthDate: user.birthDate,
        profilePicture: profilePicturePath || null,
        landlordId: landlordId || null,
        verificationStatus: verificationStatus,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    upload.single("profilePicture")(req, res, async (err) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
      }

      const { firstName, lastName, email, phoneNumber, birthDate, password } =
        req.body;

      if (!firstName || !lastName || !email || !phoneNumber || !birthDate) {
        return res.status(400).json({ error: "All fields are required" });
      }

      try {
        const [existingUser] = await db.execute(
          "SELECT user_id FROM User WHERE email = ? AND User.user_id != ?",
          [encryptEmail(email), id]
        );
        if (existingUser.length) {
          return res.status(409).json({ error: "Email already in use" });
        }

        const hashedPassword = password
          ? await bcrypt.hash(password, 10)
          : null;

        let profilePicturePath = null;
        if (req.file) {
          const originalFilePath = req.file.path;
          const resizedFileName = `resized-${Date.now()}-${req.file.filename}`;
          const resizedFilePath = path.join(
            "./public/uploads",
            resizedFileName
          );

          await sharp(originalFilePath)
            .resize(256, 256)
            .toFormat("jpeg")
            .jpeg({ quality: 80 })
            .toFile(resizedFilePath);

          profilePicturePath = `/uploads/${resizedFileName}`;

          // Optionally delete the original file
          fs.unlinkSync(originalFilePath);
        }

        await db.execute(
          `UPDATE User SET 
          firstName = ?, lastName = ?, email = ?, phoneNumber = ?, birthDate = ?, password = COALESCE(?, password)
          WHERE user_id = ?`,
          [
            JSON.stringify(encryptData(firstName, process.env.ENCRYPTION_SECRET)),
            JSON.stringify(encryptData(lastName, process.env.ENCRYPTION_SECRET)),
            JSON.stringify(encryptData(email, process.env.ENCRYPTION_SECRET)),
            JSON.stringify(encryptData(phoneNumber, process.env.ENCRYPTION_SECRET)),
            birthDate,
            hashedPassword,
            id,
          ]
        );

        const [userRows] = await db.execute(
          "SELECT userType FROM User WHERE user_id = ?",
          [id]
        );
        const userType = userRows[0]?.userType;

        if (userType === "landlord") {
          await db.execute(
            "UPDATE Landlord SET profilePicture = ? WHERE user_id = ?",
            [profilePicturePath, id]
          );
        } else if (userType === "tenant") {
          await db.execute(
            "UPDATE Tenant SET profilePicture = ? WHERE user_id = ?",
            [profilePicturePath, id]
          );
        }

        res.status(200).json({ message: "Profile updated successfully" });
      } catch (error) {
        console.error(error); // Log the error for better debugging
        res.status(500).json({ error: "Internal server error" });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
