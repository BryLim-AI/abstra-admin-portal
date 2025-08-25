import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });

  // Expire the JWT cookie immediately
  response.cookies.set("token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "strict",
  });

  return response;
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
