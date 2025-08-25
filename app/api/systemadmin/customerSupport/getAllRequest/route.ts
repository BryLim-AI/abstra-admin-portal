import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    const [supportRequest] = await db.query(
      "SELECT * FROM SupportRequest ORDER BY created_at DESC"
    );
// @ts-ignore
    const supportRequests = supportRequest.map((request: any) => ({
      ...request,
      email: decryptData(JSON.parse(request.email), process.env.ENCRYPTION_SECRET!),
    }));

    return NextResponse.json(supportRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching support requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch support requests." },
      { status: 500 }
    );
  }
}

export function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
