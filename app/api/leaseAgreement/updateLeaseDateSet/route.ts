import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();
        console.log('Received lease update:', body);

        const { unit_id, start_date, end_date } = body;

        if (!unit_id || !start_date || !end_date) {
            return NextResponse.json(
                { error: "Unit ID, start date and end date are required" },
                { status: 400 }
            );
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (endDate <= startDate) {
            return NextResponse.json(
                { error: "End date must be after the start date" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        // 1. Try to get tenant_id from LeaseAgreement (pending or draft)
        const [leaseRows]: any = await connection.execute(
            `SELECT tenant_id FROM LeaseAgreement 
             WHERE unit_id = ? AND status IN ('pending') 
             LIMIT 1`,
            [unit_id]
        );

        let tenant_id: string | null = null;

        if (leaseRows.length > 0) {
            tenant_id = leaseRows[0].tenant_id;
            console.log('Using tenant_id from LeaseAgreement:', tenant_id);
        } else {
            // 2. Fallback to ProspectiveTenant
            const [prospectiveRows]: any = await connection.execute(
                `SELECT tenant_id FROM ProspectiveTenant 
                 WHERE unit_id = ? AND status = 'approved' 
                 LIMIT 1`,
                [unit_id]
            );

            if (prospectiveRows.length === 0) {
                return NextResponse.json(
                    { error: "No pending lease or approved tenant found" },
                    { status: 404 }
                );
            }

            tenant_id = prospectiveRows[0].tenant_id;
            console.log('Using tenant_id from ProspectiveTenant:', tenant_id);
        }

        // Proceed with updating LeaseAgreement
        const [result]: any = await connection.execute(
            `UPDATE LeaseAgreement
             SET start_date = ?, end_date = ?, status = 'active'
             WHERE unit_id = ? AND tenant_id = ?`,
            [start_date, end_date, unit_id, tenant_id]
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: "No lease agreement found to update" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Lease updated successfully", start_date, end_date },
            { status: 200 }
        );
    } catch (error) {
        await connection.rollback();
        console.error("Error updating lease:", error);
        return NextResponse.json(
            { error: "Failed to update lease" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
