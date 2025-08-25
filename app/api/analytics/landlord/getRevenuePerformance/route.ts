import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlordId");

    if (!landlordId) {
        return NextResponse.json(
            { error: "landlordId is required" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.execute(
            `
                SELECT
                    DATE_FORMAT(p.payment_date, '%b') AS month_short,
                    MONTH(p.payment_date) AS month_num,
                    YEAR(p.payment_date) AS year_num,
                    SUM(p.amount_paid) AS revenue
                FROM Payment p
                         JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
                         JOIN Unit u ON la.unit_id = u.unit_id
                         JOIN Property pr ON u.property_id = pr.property_id
                WHERE pr.landlord_id = ?
                  AND p.payment_status = 'confirmed'
                GROUP BY year_num, month_num, month_short
                ORDER BY year_num ASC, month_num ASC
            `,
            [landlordId]
        );

        // Find the range of months to cover (instead of hardcoding Jan–Dec)
        const now = new Date();
        const months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(now.getFullYear(), i, 1);
            return {
                month_short: date.toLocaleString("en-US", { month: "short" }),
                month_num: i + 1,
                year_num: now.getFullYear(),
            };
        });

        const result = months.map(({ month_short, month_num, year_num }) => {
            const found = rows.find(
                (r: any) =>
                    r.month_num === month_num && r.year_num === year_num
            );
            return {
                month: month_short,
                revenue: found ? Number(found.revenue) : 0,
            };
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("Error fetching monthly revenue:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
