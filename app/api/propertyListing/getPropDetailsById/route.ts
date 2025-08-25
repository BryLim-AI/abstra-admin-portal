import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("id");

    if (!property_id) {
        return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    try {
        const [result] = await db.query(
            `
      SELECT 
        property_id,
        property_name,
        property_type,
        description,
        street,
        brgy_district,
        city,
        province,
        zip_code,
        floor_area,
        amenities,
        utility_billing_type,
        assoc_dues,
        late_fee,
        min_stay
      FROM Property
      WHERE property_id = ?
      `,
            [property_id]
        );

        // @ts-ignore
        if (!result || result.length === 0) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        // @ts-ignore
        const property = result[0];

        // Format amenity string to array if needed
        return NextResponse.json({
            property: {
                ...property,
                amenities: property.amenities
                    ? property.amenities.split(",").map((a: string) => a.trim())
                    : [],
            },
        });
    } catch (error) {
        console.error("Error fetching property:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
