
import {db} from "../../../lib/db"

export default async function handler(req, res) {
    if (req.method === "GET") {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ error: "Invalid or missing token" });
        }
        try {
            const [user] = await db.query(
                "SELECT userID, verificationToken, emailVerified, tokenExpiresAt FROM User WHERE verificationToken = ?",
                [token]
            );

            if (user.length === 0 ) {
                return res.status(400).json({ error: "Invalid token" });
            }
            if (user[0].emailVerified) {
                return res.status(400).json({
                    error: "This email is already verified. No further action is needed.",
                });
            }

            const currentTime = new Date();
            if (currentTime > new Date(user[0].tokenExpiresAt)) {
                return res.status(400).json({
                    error: "Token has expired. Please request a new verification email.",
                });
            }

            await db.query(
                "UPDATE User SET emailVerified = 1, verificationToken = NULL WHERE userID = ?",
                [user[0].userID]
            );

            return res.status(200).json({ message: "Email confirmed successfully" });
        } catch (error) {
            console.error("Error during email confirmation:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}
