import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { decryptData } from '@/crypto/encrypt';
import { NextRequest, NextResponse } from 'next/server';

const dbConfig = {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  console.log("Received Token:", token);

  if (!token || typeof token !== 'string') {
    console.log("No valid token found.");
    return NextResponse.json({ message: 'Unauthorized: No valid token found.' }, { status: 401 });
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    const user_id = payload.user_id;

    if (!user_id) {
      return NextResponse.json({ message: 'Invalid token data' }, { status: 400 });
    }

    const { otp } = await req.json();

    if (!otp || otp.length !== 6) {
      return NextResponse.json({ message: 'OTP must be a 6-digit number' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [otpResult] = await connection.execute<any[]>(
      `
      SELECT * FROM UserToken
      WHERE user_id = ? AND token = ?
        AND token_type = 'email_verification'
        AND expires_at > NOW() AND used_at IS NULL
    `,
      [user_id, otp]
    );

    console.log("OTP Query Result:", otpResult);
    if (otpResult.length === 0) {
      console.log("OTP not found or expired:", { user_id, otp });
      return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
    }

    await connection.execute(
      "DELETE FROM UserToken WHERE user_id = ? AND token = ?",
      [user_id, otp]
    );

    await connection.execute("UPDATE User SET emailVerified = 1 WHERE user_id = ?", [user_id]);

    const [userResult] = await connection.execute<any[]>(
      "SELECT firstName, lastName, userType FROM User WHERE user_id = ?",
      [user_id]
    );

    if (userResult.length === 0) {
      return NextResponse.json({ message: 'User not found.' }, { status: 400 });
    }

    const encryptedFirstName = JSON.parse(userResult[0].firstName);
    const encryptedLastName = JSON.parse(userResult[0].lastName);

    const firstName = await decryptData(encryptedFirstName, process.env.ENCRYPTION_SECRET!);
    const lastName = await decryptData(encryptedLastName, process.env.ENCRYPTION_SECRET!);

    const userType = userResult[0].userType;
    console.log("Decrypted User Data:", { firstName, lastName, userType });

    const newToken = await new SignJWT({ user_id, userType, firstName, lastName })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2h')
      .sign(secret);

    const response = NextResponse.json({
      message: "OTP verified successfully!",
      userType,
      firstName,
      lastName,
    });

    response.cookies.set('token', newToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60, // 2 hours
    });

    await connection.commit();
    await connection.end();
    return response;

  } catch (error) {
    console.error('JWT Verification Error:', error);
    return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
  }
}
