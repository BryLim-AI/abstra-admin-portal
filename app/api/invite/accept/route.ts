import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { inviteCode, userId, startDate, endDate } = body;

        if (!inviteCode || !userId) {
            return NextResponse.json({ error: 'Missing invite code or user ID' }, { status: 400 });
        }

        // 1. Validate invite code
        const [inviteRows]: any = await db.query(
            `SELECT * FROM InviteCode WHERE code = ? AND status = 'PENDING'`,
            [inviteCode]
        );
        const invite = inviteRows[0];

        if (!invite) {
            return NextResponse.json({ error: 'Invite code not found or already used.' }, { status: 404 });
        }

        if (new Date(invite.expiresAt) < new Date()) {
            return NextResponse.json({ error: 'Invite code has expired.' }, { status: 410 });
        }

        // 2. Get tenant_id using userId
        const [tenantRows]: any = await db.query(
            `SELECT tenant_id FROM Tenant WHERE user_id = ?`,
            [userId]
        );
        const tenant = tenantRows[0];

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant account not found for this user.' }, { status: 404 });
        }

        // 3. Prepare dates
        const leaseStart = startDate ? new Date(startDate) : null;
        const leaseEnd = endDate ? new Date(endDate) : null;

        // 4. Insert lease agreement
        await db.query(
            `INSERT INTO LeaseAgreement (
                tenant_id, unit_id, start_date, end_date, status,
                is_security_deposit_paid, is_advance_payment_paid
            ) VALUES (?, ?, ?, ?, 'pending', 1, 1)`,
            [tenant.tenant_id, invite.unitId, leaseStart, leaseEnd]
        );

        // 5. Mark invite code as used
        await db.query(
            `UPDATE InviteCode SET status = 'USED' WHERE code = ?`,
            [inviteCode]
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Invite redeem error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
