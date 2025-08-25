import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { listingLimits } from "@/constant/subscription/limits";

// @ts-ignore
export async function GET(req: NextRequest, { params }) {
  const { landlord_id } = params;

  if (!landlord_id) {
    return NextResponse.json(
        { error: "Missing landlord_id" },
        { status: 400 }
    );
  }

  try {
    const [rows] = await db.query(
        `SELECT plan_name, start_date, end_date, payment_status, is_trial, is_active
         FROM Subscription
         WHERE landlord_id = ? AND is_active = 1`,
        [landlord_id]
    );

    // @ts-ignore
    if (!rows || rows.length === 0) {
      return NextResponse.json(
          { error: "Subscription not found" },
          { status: 404 }
      );
    }

    // @ts-ignore
    let subscription = rows[0];
    const currentDate = new Date();
    const endDate = subscription.end_date ? new Date(subscription.end_date) : null;

    if (endDate && endDate < currentDate && subscription.is_active === 1) {
      await db.query(
          "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?",
          [landlord_id]
      );
      subscription.is_active = 0;
    }

    // @ts-ignore
    const limits = listingLimits[subscription.plan_name] || {};
    subscription.listingLimits = limits;

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
  }
}
