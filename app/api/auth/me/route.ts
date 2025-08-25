import { jwtVerify } from "jose";
import mysql from "mysql2/promise";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Initialize DB pool
const db = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
});

export async function GET() {
  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (!payload || (!payload.user_id && !payload.admin_id)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Handle regular user
    if (payload.user_id) {
      const userId = payload.user_id;
      const [userRows] = await db.execute<any[]>(
        `
        SELECT 
          u.user_id,
          u.firstName,
          u.lastName,
          u.email,
          u.userType,
          u.profilePicture,
          u.is_2fa_enabled,
          u.phoneNumber,
          u.birthDate,
          u.points,
          t.tenant_id,
          l.landlord_id,
          l.is_verified,
          l.is_trial_used
        FROM User u
        LEFT JOIN Tenant t ON u.user_id = t.user_id
        LEFT JOIN Landlord l ON u.user_id = l.user_id
        WHERE u.user_id = ?
        `,
        [userId]
      );

      if (userRows.length > 0) {
        const user = userRows[0];

        // If landlord, fetch subscription
        if (user.landlord_id) {
          const [subscriptionRows] = await db.execute<any[]>(
            `
            SELECT * FROM Subscription
            WHERE landlord_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [user.landlord_id]
          );

          user.subscription = subscriptionRows.length > 0 ? subscriptionRows[0] : null;
          user.is_trial_used = !!user.is_trial_used;
        }

        return NextResponse.json(user, { status: 200 });
      }
    }

    // Handle admin user
    if (payload.admin_id) {
      const adminId = payload.admin_id;
      const [adminRows] = await db.execute<any[]>(
        `
        SELECT 
          a.admin_id,
          a.username,
          a.first_name,
          a.last_name,
          a.profile_picture,
          a.email,
          a.role,
          a.status,
          a.permissions
        FROM Admin a
        WHERE a.admin_id = ?
        `,
        [adminId]
      );

      if (adminRows.length > 0) {
        const admin = adminRows[0];

        return NextResponse.json({
          admin_id: admin.admin_id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          status: admin.status,
          first_name: admin.first_name,
          last_name: admin.last_name,
          profile_picture: admin.profile_picture,
          permissions: admin.permissions,
        }, { status: 200 });
      }
    }
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}