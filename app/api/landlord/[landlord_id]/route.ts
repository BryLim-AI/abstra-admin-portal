import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';
import type { RowDataPacket, FieldPacket } from 'mysql2';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ landlord_id: string }> }
) {
  const { landlord_id } = await params;
  try {
    const query = "SELECT landlord_id FROM Landlord WHERE landlord_id = ?";
    const [rows, fields]: [RowDataPacket[], FieldPacket[]] = await db.execute(
        'SELECT landlord_id FROM Landlord WHERE landlord_id = ?',
        [landlord_id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Landlord not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error fetching landlord ID:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}
