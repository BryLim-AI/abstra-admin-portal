import { db } from "@/lib/db";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { cookies as getCookies } from "next/headers";

export async function PUT(req: NextRequest) {
    const body = await req.json();
    const cookies = getCookies();
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    console.log("data received", body);

    if (!property_id) {
        return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    const connection = await db.getConnection();

    try {
        // Check if property exists
        const [existingRows] = await connection.execute(
            `SELECT * FROM Property WHERE property_id = ?`,
            [property_id]
        );
        // @ts-ignore
        if (!existingRows.length) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        await connection.beginTransaction();

        // Normalize fields (camelCase or snake_case)
        const propertyName = body.propertyName ?? body.property_name ?? null;
        const propertyType = body.propertyType ?? body.property_type ?? null;
        const street = body.street ?? null;
        const brgyDistrict = body.brgyDistrict ?? body.brgy_district ?? null;
        const city = body.city ?? null;
        const zipCode = body.zipCode ?? body.zip_code ?? null;
        const province = body.province ?? null;
        const utilityBillingType = body.utilityBillingType ?? body.utility_billing_type ?? null;
        const propDesc = body.propDesc ?? body.description ?? null;
        const floorArea = body.floorArea ?? body.floor_area ?? null;
        const minStay = body.minStay ?? body.min_stay ?? null;
        const assocDues = body.assocDues ?? body.assoc_dues ?? null;
        const lateFee = body.lateFee ?? body.late_fee ?? null;
        const paymentFrequency = body.paymentFrequency ?? body.payment_frequency ?? null;
        const flexiPayEnabled = body.flexiPayEnabled ?? body.flexipay_enabled ?? false;
        const amenities = body.amenities ?? null;
        const paymentMethodsAccepted = body.paymentMethodsAccepted ?? body.accepted_payment_methods ?? null;
        const propertyPreferences = body.propertyPreferences ?? body.property_preferences ?? null;
        const latitude = body.lat ?? body.latitude ?? null;
        const longitude = body.lng ?? body.longitude ?? null;

        // Normalize arrays / JSON fields
        const amenitiesString = Array.isArray(amenities)
            ? amenities.join(",")
            : typeof amenities === "string" && amenities
                ? amenities
                : null;

        const propertyPreferencesJson = propertyPreferences
            ? (Array.isArray(propertyPreferences)
                ? JSON.stringify(propertyPreferences)
                : typeof propertyPreferences === "string"
                    ? propertyPreferences
                    : JSON.stringify([propertyPreferences]))
            : null;

        const paymentMethodsJson = paymentMethodsAccepted
            ? (Array.isArray(paymentMethodsAccepted)
                ? JSON.stringify(paymentMethodsAccepted)
                : typeof paymentMethodsAccepted === "string"
                    ? paymentMethodsAccepted
                    : JSON.stringify([paymentMethodsAccepted]))
            : null;

        // Execute update
        await connection.execute(
            `UPDATE Property SET
                property_name = ?,
                property_type = ?,
                amenities = ?,
                street = ?,
                brgy_district = ?,
                city = ?,
                zip_code = ?,
                province = ?,
                utility_billing_type = ?,
                description = ?,
                floor_area = ?,
                min_stay = ?,
                assoc_dues = ?,
                late_fee = ?,
                payment_frequency = ?,
                flexipay_enabled = ?,
                property_preferences = ?,
                accepted_payment_methods = ?,
                latitude = ?,
                longitude = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE property_id = ?`,
            [
                propertyName,
                propertyType,
                amenitiesString,
                street,
                brgyDistrict,
                city,
                zipCode,
                province,
                utilityBillingType,
                propDesc,
                floorArea,
                minStay,
                assocDues,
                lateFee,
                paymentFrequency,
                flexiPayEnabled,
                propertyPreferencesJson,
                paymentMethodsJson,
                latitude,
                longitude,
                property_id,
            ]
        );

        // Authorization / activity log
        // @ts-ignore
        const token = cookies.get("token")?.value;
        if (!token) {
            await connection.rollback();
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const loggedUser = payload.user_id;

        await db.query(
            "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
            [loggedUser, `Updated Property ${propertyName}`]
        );

        await connection.commit();

        return NextResponse.json({ property_id: property_id, ...body }, { status: 200 });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating property listing:", error);
        return NextResponse.json({ error: "Failed to update property listing" }, { status: 500 });
    } finally {
        connection.release();
    }
}
