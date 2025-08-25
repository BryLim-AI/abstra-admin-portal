import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { decryptData } from '@/crypto/encrypt';

// MySQL pool connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '+08:00',
});

export async function GET(req: NextRequest) {
    const landlordId = req.nextUrl.searchParams.get('landlord_id');

    if (!landlordId) {
        return NextResponse.json({ error: 'Missing landlord_id' }, { status: 400 });
    }

    try {
        const [rows]: any = await db.query(
            `
                SELECT
                    p.payment_id,
                    p.agreement_id,
                    p.payment_type,
                    p.amount_paid,
                    p.payment_status,
                    p.proof_of_payment,
                    p.payment_date,
                    la.tenant_id,
                    u.unit_name,
                    pr.property_name,
                    us.firstName AS encrypted_first_name,
                    us.lastName AS encrypted_last_name
                FROM Payment p
                         JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
                         JOIN Unit u ON la.unit_id = u.unit_id
                         JOIN Property pr ON u.property_id = pr.property_id
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                         JOIN User us ON t.user_id = us.user_id
                WHERE pr.landlord_id = ?
                  AND p.payment_status = 'pending'
                ORDER BY p.payment_date DESC
            `,
            [landlordId]
        );

        const decryptedRows = rows.map((row: any) => {
            let firstName = row.encrypted_first_name;
            let lastName = row.encrypted_last_name;

            try {
                if (firstName) {
                    firstName = decryptData(JSON.parse(firstName), process.env.ENCRYPTION_SECRET!);
                }

                if (lastName) {
                    lastName = decryptData(JSON.parse(lastName), process.env.ENCRYPTION_SECRET!);
                }
            } catch (err) {
                console.error(`Decryption error for tenant_id ${row.tenant_id || 'N/A'}:`, err);
            }

            return {
                ...row,
                tenant_name: `${firstName} ${lastName}`.trim(),
                firstName,
                lastName,
            };
        });

        return NextResponse.json(decryptedRows, { status: 200 });
    } catch (error) {
        console.error('Error fetching pending payments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
