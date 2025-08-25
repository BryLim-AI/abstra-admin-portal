// app/api/tenant/billing/[billing_id]/route.ts
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { billing_id: string } }) {
    const { billing_id } = params;

    if (!billing_id) {
        return NextResponse.json({ message: "Billing ID is required." }, { status: 400 });
    }

    try {
        // Fetch billing and tenant info
        const [rows]: any = await db.query(
            `SELECT
                 b.billing_id, b.billing_period, b.total_water_amount, b.total_electricity_amount,
                 b.penalty_amount, b.discount_amount, b.total_amount_due, b.status AS billing_status,
                 b.due_date, b.paid_at, b.created_at AS billing_created, b.updated_at AS billing_updated,
                 u.unit_id, u.unit_name, u.unit_size, u.furnish, u.bed_spacing, u.avail_beds, u.rent_amount, u.status AS unit_status,
                 p.property_id, p.property_name, p.property_type, p.street, p.brgy_district, p.city, p.zip_code, p.province, p.floor_area, p.payment_frequency, p.assoc_dues,
                 t.tenant_id, t.user_id AS tenant_user_id, t.address AS tenant_address, t.occupation AS tenant_occupation, t.employment_type AS tenant_employment_type, t.monthly_income,
                 us.user_id AS user_id, us.firstName, us.lastName, us.email, us.phoneNumber, us.userType
             FROM Billing b
                      JOIN Unit u ON u.unit_id = b.unit_id
                      JOIN Property p ON p.property_id = u.property_id
                      JOIN LeaseAgreement la ON la.unit_id = u.unit_id
                      JOIN Tenant t ON t.tenant_id = la.tenant_id
                      LEFT JOIN User us ON us.user_id = t.user_id
             WHERE b.billing_id = ?`,
            [billing_id]
        );

        if (!rows.length) {
            return NextResponse.json({ message: "Billing not found." }, { status: 404 });
        }

        const row = rows[0];

        // Decrypt tenant info
        const decryptedTenantUser = {
            user_id: row.user_id,
            firstName: row.firstName ? decryptData(JSON.parse(row.firstName), process.env.ENCRYPTION_SECRET!) : null,
            lastName: row.lastName ? decryptData(JSON.parse(row.lastName), process.env.ENCRYPTION_SECRET!) : null,
            email: row.email ? decryptData(JSON.parse(row.email), process.env.ENCRYPTION_SECRET!) : null,
            phoneNumber: row.phoneNumber ? decryptData(JSON.parse(row.phoneNumber), process.env.ENCRYPTION_SECRET!) : null,
            userType: row.userType,
        };

        // Fetch meter readings by unit and billing period
        const [meterReadings]: any = await db.query(
            `SELECT utility_type, previous_reading, current_reading
             FROM MeterReading
             WHERE unit_id = ? AND reading_date BETWEEN DATE_SUB(?, INTERVAL 1 MONTH) AND ?`,
            [row.unit_id, row.billing_period, row.billing_period]
        );

        const readingsByType = meterReadings.reduce((acc: any, r: any) => {
            acc[r.utility_type] = {
                previous: r.previous_reading,
                current: r.current_reading
            };
            return acc;
        }, {});

        const billing = {
            billing_id: row.billing_id,
            billing_period: row.billing_period,
            total_water_amount: row.total_water_amount,
            total_electricity_amount: row.total_electricity_amount,
            penalty_amount: row.penalty_amount,
            discount_amount: row.discount_amount,
            total_amount_due: row.total_amount_due,
            status: row.billing_status,
            due_date: row.due_date,
            paid_at: row.paid_at,
            created_at: row.billing_created,
            updated_at: row.billing_updated,
            meter_readings: readingsByType,
            unit: {
                unit_id: row.unit_id,
                unit_name: row.unit_name,
                unit_size: row.unit_size,
                furnish: row.furnish,
                bed_spacing: row.bed_spacing,
                avail_beds: row.avail_beds,
                rent_amount: row.rent_amount,
                status: row.unit_status,
            },
            property: {
                property_id: row.property_id,
                property_name: row.property_name,
                property_type: row.property_type,
                street: row.street,
                brgy_district: row.brgy_district,
                city: row.city,
                zip_code: row.zip_code,
                province: row.province,
                floor_area: row.floor_area,
                payment_frequency: row.payment_frequency,
                assoc_dues: row.assoc_dues,
            },
            tenant: {
                tenant_id: row.tenant_id,
                user_id: row.tenant_user_id,
                address: row.tenant_address,
                occupation: row.tenant_occupation,
                employment_type: row.tenant_employment_type,
                monthly_income: row.monthly_income,
                user: decryptedTenantUser,
            },
        };

        return NextResponse.json({ billing }, { status: 200 });
    } catch (error) {
        console.error("Billing API Error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
