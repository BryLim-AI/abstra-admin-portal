import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(`Debug: Received request body:`, body);

    const { landlord_id, plan_name } = body;

    if (!landlord_id) {
      console.error("Missing landlord_id.");
      return NextResponse.json({ error: "Missing landlord_id." }, { status: 400 });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    });

    console.log(`Checking database for landlord_id: ${landlord_id}`);
    const [landlordData] = await connection.execute(
      "SELECT is_trial_used FROM Landlord WHERE landlord_id = ? LIMIT 1",
      [landlord_id]
    );

    console.log(`Debug: Fetched landlordData:`, landlordData);

    if (!Array.isArray(landlordData) || landlordData.length === 0) {
      console.error(`No landlord found with landlord_id: ${landlord_id}`);
      await connection.end();
      return NextResponse.json({ error: "Landlord not found." }, { status: 404 });
    }

    const { is_trial_used } = landlordData[0] as any;
    const startDate = new Date().toISOString().split("T")[0];

    if (!plan_name) {
      await connection.end();
      return NextResponse.json({ is_trial_used }, { status: 200 });
    }

    if (plan_name === "Free Plan") {
      await connection.execute(
        "INSERT INTO Subscription (landlord_id, plan_name, start_date, end_date, payment_status, is_trial, created_at, request_reference_number, is_active) VALUES (?, ?, ?, '', 'paid', 0, NOW(), 0, 1)",
        [landlord_id, plan_name, startDate]
      );
      await connection.end();
      return NextResponse.json({ message: "Free Plan activated.", startDate }, { status: 201 });
    }

    if (is_trial_used) {
      await connection.end();
      return NextResponse.json(
        { error: "Trial already used. Please subscribe to continue." },
        { status: 403 }
      );
    }

    if (["Standard Plan", "Premium Plan"].includes(plan_name)) {
      const trialDays = plan_name === "Standard Plan" ? 10 : 14;
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      const formattedTrialEndDate = trialEndDate.toISOString().split("T")[0];

      await connection.execute(
        "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?",
        [landlord_id]
      );

      await connection.execute(
        "INSERT INTO Subscription (landlord_id, plan_name, start_date, end_date, payment_status, is_trial, created_at, request_reference_number, is_active)" +
        " VALUES (?, ?, ?, ?, 'paid', 1, NOW(), 0, 1)",
        [landlord_id, plan_name, startDate, formattedTrialEndDate]
      );

      await connection.execute(
        "UPDATE Landlord SET is_trial_used = 1 WHERE landlord_id = ?",
        [landlord_id]
      );

      await connection.end();
      return NextResponse.json(
        {
          message: `${trialDays}-day free trial activated.`,
          trialEndDate: formattedTrialEndDate,
        },
        { status: 201 }
      );
    }

    await connection.end();
    return NextResponse.json({ error: "Invalid plan selection." }, { status: 400 });
  } catch (error) {
    console.error("[grantingFreeTrial] Internal error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
