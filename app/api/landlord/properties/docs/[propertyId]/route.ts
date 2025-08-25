import { NextRequest } from 'next/server';
import mysql from 'mysql2/promise';
import { decryptData } from '../../../../../../crypto/encrypt';

export async function GET(
    req: NextRequest,
    { params }: { params: { propertyId: string } }
) {
    const propertyId = params.propertyId;

    if (!propertyId) {
        return new Response(JSON.stringify({ message: 'Missing property ID' }), { status: 400 });
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            timezone: '+08:00',
        });

        const [rows] = await connection.execute(
            `SELECT occ_permit, mayor_permit, property_title, outdoor_photo, indoor_photo
       FROM PropertyVerification
       WHERE property_id = ?`,
            [propertyId]
        );

        if (!Array.isArray(rows) || rows.length === 0) {
            return new Response(JSON.stringify({ message: 'Verification documents not found' }), { status: 404 });
        }

        const secretKey = process.env.ENCRYPTION_SECRET;
        if (!secretKey) {
            console.error('Missing ENCRYPTION_SECRET');
            return new Response(JSON.stringify({ message: 'Encryption key missing' }), { status: 500 });
        }

        const data = rows[0] as any;

        const decryptIfValid = (field: string | null) => {
            if (!field || typeof field !== 'string') return null;
            try {
                const parsed = field.trim().startsWith('{') ? JSON.parse(field) : null;
                return parsed ? decryptData(parsed, secretKey) : null;
            } catch (err) {
                console.error('Failed to decrypt field:', err);
                return null;
            }
        };

        const decryptedData = {
            occ_permit: decryptIfValid(data.occ_permit),
            mayor_permit: decryptIfValid(data.mayor_permit),
            property_title: decryptIfValid(data.property_title),
            outdoor_photo: decryptIfValid(data.outdoor_photo),
            indoor_photo: decryptIfValid(data.indoor_photo),
        };

        return new Response(JSON.stringify(decryptedData), { status: 200 });
    } catch (err) {
        console.error('Database Error:', err);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
    }
}
