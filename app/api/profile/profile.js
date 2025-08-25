import { jwtVerify } from "jose";
import {decryptData} from "../../../crypto/encrypt";
import {db} from "../../../lib/db";


export default async function viewProfile(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const token = req.cookies.token;

    if (!token) {
        console.error("Token not found in cookies.");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        if (!payload || (!payload.user_id && !payload.admin_id)) {
            return res.status(401).json({ error: "Invalid session" });
        }

        const encryptionKey = process.env.ENCRYPTION_SECRET;
        if (!encryptionKey) {
            console.error("Missing ENCRYPTION_SECRET in environment variables.");
            return res.status(500).json({ error: "Server misconfiguration" });
        }

        let userData = null;

        if (payload.user_id) {
            const userId = payload.user_id;
            const [userRows] = await db.execute(
                `
        SELECT 
            u.user_id,
            u.firstName,
            u.lastName,
            u.email,
            u.profilePicture,
            u.userType,
            t.tenant_id,
            l.landlord_id,
            l.is_verified
        FROM User u
        LEFT JOIN Tenant t ON u.user_id = t.user_id
        LEFT JOIN Landlord l ON u.user_id = l.user_id
        WHERE u.user_id = ?
        `,
                [userId]
            );

            if (userRows.length > 0) {
                const user = userRows[0];

                userData = {
                    user_id: user.user_id,
                    firstName: decryptData(isJson(user.firstName) ? JSON.parse(user.firstName) : user.firstName, encryptionKey),
                    lastName: decryptData(isJson(user.lastName) ? JSON.parse(user.lastName) : user.lastName, encryptionKey),
                    email: decryptData(user.email, encryptionKey),
                    userType: user.userType,
                    tenant_id: user.tenant_id || null,
                    landlord_id: user.landlord_id || null,
                    profilePicture: user.profilePicture || null,
                    is_verified: user.is_verified || null,
                };
            }
        }

        //region  FOR SYSTEM ADMIN PROFILE
        if (payload.admin_id) {
            const adminId = payload.admin_id;
            const [adminRows] = await db.execute(
                `
        SELECT 
            a.admin_id,
            a.username,
            a.email,
            a.role,
            a.status
        FROM Admin a
        WHERE a.admin_id = ?
        `,
                [adminId]
            );

            if (adminRows.length > 0) {
                const admin = adminRows[0];

                userData = {
                    admin_id: admin.admin_id,
                    username: decryptData(admin.username, encryptionKey),
                    email: admin.email,
                    role: admin.role,
                    status: admin.status,
                    userType: "admin",
                };
            }
        }

        //endregion

        if (!userData) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(userData);
    } catch (error) {
        console.error("Token verification or database error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Helper function to check if a string is JSON
function isJson(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
}
