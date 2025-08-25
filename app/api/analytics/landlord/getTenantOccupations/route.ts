import { db } from "@/lib/db";
import occupationsList from "@/constant/occupations";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const landlord_id = searchParams.get("landlord_id");

  if (!landlord_id) {
    return NextResponse.json(
      { message: "Missing landlord_id parameter" },
      { status: 400 }
    );
  }

  try {
    const [rows]: any = await db.execute(
      `SELECT t.occupation, 
              COUNT(t.tenant_id) AS tenant_count, 
              (COUNT(t.tenant_id) * 100 / (SELECT COUNT(*) 
                              FROM Tenant t 
                              JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
                              JOIN Unit u ON la.unit_id = u.unit_id
                              JOIN Property pr ON u.property_id = pr.property_id
                              WHERE pr.landlord_id = ? 
                              AND la.status = 'active')) AS percentage
       FROM Tenant t
       JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
       JOIN Unit u ON la.unit_id = u.unit_id
       JOIN Property pr ON u.property_id = pr.property_id
       WHERE pr.landlord_id = ?
       AND la.status = 'active'
       GROUP BY t.occupation
       ORDER BY tenant_count DESC;`,
      [landlord_id, landlord_id]
    );

    const formattedOccupations = rows.map((item: any) => {
      const occupationLabel =
        occupationsList.find((occ) => occ.value === item.occupation)?.label ||
        item.occupation;

      return {
        occupation: occupationLabel,
        tenant_count: item.tenant_count,
        percentage: item.percentage,
      };
    });

    return NextResponse.json(formattedOccupations);
  } catch (error) {
    console.error("Error fetching tenant occupation analytics:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
