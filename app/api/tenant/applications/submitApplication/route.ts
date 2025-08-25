import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const {
      tenant_id,
      address,
      occupation,
      employment_type,
      monthly_income,
    } = await req.json();

    if (
      !tenant_id ||
      !address ||
      !occupation ||
      !employment_type ||
      !monthly_income
    ) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    const [result]: any = await db.query(
      "UPDATE Tenant SET address = ?, occupation = ?, employment_type = ?, monthly_income = ?, updatedAt = NOW() WHERE tenant_id = ?",
      [address, occupation, employment_type, monthly_income, tenant_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: "Tenant not found or no changes made." }, { status: 404 });
    }

    return NextResponse.json({ message: "Tenant info updated successfully!" });
  } catch (error) {
    console.error("❌ [Submit Info] Error:", error);
    return NextResponse.json({ message: "Failed to save tenant info", error }, { status: 500 });
  }
}
