import { db } from "../../../lib/db";
import { getCookie } from "cookies-next";
import { jwtVerify } from "jose";
import { encryptData } from "../../../crypto/encrypt";

export default async function adminUpdateProfile(req, res){
    const token = await getCookie("token", { req, res });
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { first_name, last_name } = req.body;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const admin_id = payload.admin_id;

    const firstNameEncrypted = first_name ? JSON.stringify(await encryptData(first_name, process.env.ENCRYPTION_SECRET)) : null;
    const lastNameEncrypted = last_name ? JSON.stringify(await encryptData(last_name, process.env.ENCRYPTION_SECRET)) : null;

    const [profile] = await db.query(
        `UPDATE Admin SET first_name = ?, last_name = ? WHERE admin_id = ?`,
        [firstNameEncrypted, lastNameEncrypted, admin_id]
    );

    await db.query(
        "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
        [admin_id, `Updated Profile`]
    );
    res.status(200).json({ message: "Profile updated successfully" });
}