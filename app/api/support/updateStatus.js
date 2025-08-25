import nodemailer from "nodemailer";
import { db } from "../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { support_id, status, message } = req.body;

        if (!support_id || !status || !message) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const [results] = await db.query("SELECT email, issue FROM SupportRequest WHERE support_id = ?", [support_id]);

        if (!results || results.length === 0) {
            return res.status(404).json({ error: "Support request not found." });
        }

        const { email, issue } = results[0];

        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `HESTIA Support Request Update: ${issue}`,
            text: `Hello ${email},\n${message}\n\nThank you,\nSupport Team`,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: "Support status updated and email sent successfully." });

    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Failed to send email notification." });
    }
}
