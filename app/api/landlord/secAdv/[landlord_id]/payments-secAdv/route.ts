import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { decryptData } from "../../../../../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(
    req: Request,
    { params }: { params: { landlord_id: string } }
) {
    const { landlord_id } = params;

    if (!landlord_id) {
        return NextResponse.json({ error: "Landlord ID is required" }, { status: 400 });
    }

    try {
        const result: any = await db.query(
            `
                SELECT
                    u.user_id,
                    u.firstName,
                    u.lastName,
                    pr.property_name,
                    unit.unit_name,
                    la.is_security_deposit_paid,
                    la.is_advance_payment_paid
                FROM Tenant t
                         JOIN User u ON u.user_id = t.user_id
                         JOIN LeaseAgreement la ON la.tenant_id = t.tenant_id
                         JOIN Unit unit ON unit.unit_id = la.unit_id
                         JOIN Property pr ON pr.property_id = unit.property_id
                WHERE pr.landlord_id = ?
                  AND (la.is_security_deposit_paid = 1 OR la.is_advance_payment_paid = 1)
            `,
            [landlord_id]
        );

        const rows = result[0];

        const tenants = rows.map((r: any) => {
            const decryptField = (val: any) => {
                if (!val) return "";
                try {
                    return decryptData(JSON.parse(val), SECRET_KEY);
                } catch (err) {
                    console.warn("Error decrypting field:", err);
                    return "";
                }
            };

            return {
                user_id: r.user_id || "",
                firstName: decryptField(r.firstName),
                lastName: decryptField(r.lastName),
                unit_name: r.unit_name || "",
                property_name:r.property_name || "",
                secDepositPaid: r.is_security_deposit_paid === 1,
                advPaymentPaid: r.is_advance_payment_paid === 1,
            };
        });

        return NextResponse.json({ tenants });
    } catch (err) {
        console.error("Failed to fetch tenants:", err);
        return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
    }
}
