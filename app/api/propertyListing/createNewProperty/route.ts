import { NextResponse, NextRequest } from "next/server";
import { db } from '@/lib/db';

export async function POST(req:NextRequest) {
  const connection = await db.getConnection();

  try {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");
    if (!landlord_id) {
      return NextResponse.json({ error: "User does not exist" }, { status: 400 });
    }

    const body = await req.json();
    const {
      propertyName,
      propertyType,
      amenities,
      street,
      brgyDistrict,
      city,
      zipCode,
      province,
      utilityBillingType,
      propDesc,
      floorArea,
      minStay,
      lateFee,
      assocDues,
      paymentFrequency,
      // New fields
      flexiPayEnabled = 0,
      paymentMethodsAccepted = [],
      propertyPreferences = [],
    } = body;


const address = `${street}, ${brgyDistrict}, ${city}, ${province}, ${zipCode}, Philippines`;

    // 🔍 Fetch coordinates from OpenStreetMap Nominatim API
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
      headers: { "User-Agent": "hestia-property-app/1.0" },
    });

    const geoData = await geoRes.json();
    const lat = geoData[0]?.lat || null;
    const lng = geoData[0]?.lon || null;


    const values = [
      landlord_id,
      propertyName,
      propertyType,
      amenities ? amenities.join(",") : null,
      street || null,
      parseInt(brgyDistrict) || null,
      city || null,
      zipCode || null,
      province || null,
      utilityBillingType,
      propDesc || null,
      floorArea,
      minStay || null,
      lateFee || 0.0,
      assocDues || 0.0,
      paymentFrequency || null,
      flexiPayEnabled,
      JSON.stringify(propertyPreferences || []),
      JSON.stringify(paymentMethodsAccepted || []),
      lat,
      lng,
    ];


    await connection.beginTransaction();

   const [result] = await connection.execute(
      `INSERT INTO Property (
        landlord_id, property_name, property_type, amenities, street,
        brgy_district, city, zip_code, province,
        utility_billing_type, description, floor_area,
        min_stay, late_fee, assoc_dues,
        payment_frequency, flexipay_enabled, property_preferences,accepted_payment_methods,latitude, longitude,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      values
    );


    await connection.commit();

    return NextResponse.json(
      {
        message: "Property created successfully",
        // @ts-ignore
        propertyID: result.insertId

      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating property listing:", error);
    await connection.rollback();
    return NextResponse.json(
      { error: "Failed to create property listing" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
