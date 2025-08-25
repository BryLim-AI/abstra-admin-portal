import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";

export default async function getListOfPayments(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { landlord_id } = req.query;
    if (!landlord_id) {
        return res.status(400).json({ error: 'Missing landlord_id' });
    }

    try {
        const query = `
            SELECT
                p.payment_id,
                p.payment_type,
                p.amount_paid,
                p.payment_status,
                p.payment_date,
                p.receipt_reference,
                u.unit_name,
                pr.property_name
            FROM Payment p
                     JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
                     JOIN Unit u ON la.unit_id = u.unit_id
                     JOIN Property pr ON u.property_id = pr.property_id
            WHERE pr.landlord_id = ?;
        `;

        const [rows] = await db.execute(query, [landlord_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
}