import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const token = cookies.token;

    if (!token) {
      return NextResponse.json({ isLoggedIn: false }, { status: 200 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.userType === "system_admin" || payload.role === "admin") {
      return NextResponse.json({ isLoggedIn: true }, { status: 200 });
    }

    return NextResponse.json({ isLoggedIn: false }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ isLoggedIn: false }, { status: 200 });
  }
}
