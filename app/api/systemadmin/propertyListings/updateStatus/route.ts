import { NextRequest } from 'next/server';
import mysql from 'mysql2/promise';
import { parse } from 'cookie';
import { jwtVerify } from 'jose';
import { POINTS } from '@/constant/pointSystem/points';
import { admin } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parse(cookieHeader);

    const token = cookies.token;
    if (!token) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
    }

    let decoded;
    try {
      const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secretKey);
      decoded = payload;
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, message: err.message }), { status: 401 });
    }

    const currentadmin_id = decoded?.admin_id;
    if (!currentadmin_id) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid Token Data' }), { status: 401 });
    }

    const { property_id, status, message } = await req.json();

    if (!property_id || !status) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      timezone: '+08:00',
    });

    const [rows]: any = await connection.execute(
      `SELECT pv.status, pv.attempts, l.user_id
       FROM PropertyVerification pv
       JOIN Property p ON pv.property_id = p.property_id
       JOIN Landlord l ON p.landlord_id = l.landlord_id
       JOIN User u ON l.user_id = u.user_id
       WHERE pv.property_id = ?`,
      [property_id]
    );

    if (rows.length === 0) {
      await connection.end();
      return new Response(JSON.stringify({ message: 'Property not found' }), { status: 404 });
    }

    const { status: currentStatus, attempts, user_id } = rows[0];

    if (!user_id) {
      await connection.end();
      return new Response(JSON.stringify({ message: 'Landlord not found for this property.' }), { status: 500 });
    }

    // Handle maximum rejection attempts
    if (currentStatus === 'Rejected' && attempts >= 2) {
      const notificationTitle = `Property ${status}`;
      const notificationBody = `Your property listing has been ${status.toLowerCase()} twice, you cannot resend documents again. ${
        message ? `Message: ${message}` : ''
      }`;

      await connection.execute(
        `INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())`,
        [user_id, notificationTitle, notificationBody]
      );
    }

    if (status === 'Verified') {
      const verifiedTitle = 'Property Verified';
      const verifiedBody = `🎉 Congratulations! Your property has been verified. You’ve earned ${POINTS.PROPERTY_VERIFIED} FlexiPoints.`;

      await connection.execute(
          `INSERT INTO Notification (user_id, title, body, is_read, created_at)\
           VALUES (?, ?, ?, 0, NOW())`,
          [user_id, verifiedTitle, verifiedBody]
      );

      await connection.execute(
          `UPDATE User
           SET points = points + ?
           WHERE user_id = ?`,
          [POINTS.PROPERTY_VERIFIED, user_id]
      );
    }

    const newAttempts = status === 'Rejected' ? attempts + 1 : attempts;

    const [result]: any = await connection.execute(
      `UPDATE PropertyVerification
       SET status = ?, admin_message = ?, reviewed_by = ?, attempts = ?
       WHERE property_id = ?`,
      [status, message || null, currentadmin_id, newAttempts, property_id]
    );

    if (result.affectedRows === 0) {
      await connection.end();
      return new Response(JSON.stringify({ message: 'Property not found' }), { status: 404 });
    }

    const notificationTitle = `Property ${status}`;
    const notificationBody = `Your property listing has been ${status.toLowerCase()}. ${message ? `Message: ${message}` : ''}`;

    await connection.execute(
      `INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())`,
      [user_id, notificationTitle, notificationBody]
    );

      // Fetch active FCM tokens
      const [tokensRows]: any = await connection.execute(
          `SELECT token FROM FCM_Token WHERE user_id = ? AND active = 1`,
          [user_id]
      );
      const fcmTokens = tokensRows.map((row: any) => row.token);

      console.log('fcm token: ', fcmTokens);

      if (fcmTokens.length > 0) {
          const message = {
              notification: {
                  title: notificationTitle,
                  body: notificationBody,
              },
              tokens: fcmTokens,
          };

          try {
              const response = await admin.messaging().sendEachForMulticast(message);
              console.log("✅ Notifications sent:", response.successCount);
              console.log("❌ Failed:", response.failureCount);

              response.responses.forEach((res, idx) => {
                  if (!res.success) {
                      console.error(`Error sending to ${fcmTokens[idx]}:`, res.error);
                  }
              });
          } catch (err) {
              console.error("🔥 Error sending notification:", err);
          }
      }


      await connection.end();

    return new Response(
      JSON.stringify({
        message: `Property ${status.toLowerCase()} reviewed by Admin ${currentadmin_id}.`,
        attempts: newAttempts,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating property status:', error);
    return new Response(JSON.stringify({ message: 'Error updating property status' }), {
      status: 500,
    });
  }
}
