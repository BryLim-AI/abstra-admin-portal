import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

// @ts-ignore
async function getNearbyPlaces(lat, lng) {
    const radius = 1000;
    const types = ["school", "hospital", 'mall'];
    // @ts-ignore
    let allPlaces = [];

    for (const type of types) {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.results) {
            // Add photo URLs
            // @ts-ignore
            const withPhotos = data.results.map(place => ({
                name: place.name,
                vicinity: place.vicinity,
                photoUrl: place.photos?.[0]
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_KEY}`
                    : null,
                type
            }));
            // @ts-ignore
            allPlaces = allPlaces.concat(withPhotos);
        }
    }

    // Remove duplicates by name
    const uniquePlaces = allPlaces.filter(
        (place, index, self) =>
            index === self.findIndex(p => p.name === place.name)
    );

    return uniquePlaces;
}

// @ts-ignore
async function summarizePlacesOpenRouter(places) {
    if (!places.length) {
        return "No major schools or hospitals found nearby.";
    }

    // @ts-ignore
    const placeList = places.map(p => p.name).join(", ");
    const prompt = `Summarize these nearby places for a property listing in 1-2 sentences: ${placeList}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "deepseek/deepseek-r1:free",
            messages: [
                { role: "system", content: "You are a helpful real estate assistant." },
                { role: "user", content: prompt }
            ]
        })
    });

    const json = await response.json();
    return json.choices?.[0]?.message?.content || "";
}

// @ts-ignore
export async function GET(req) {
    const { searchParams } = req.nextUrl;
    const propertyId = searchParams.get("id");

    if (!propertyId) {
        return NextResponse.json({ message: "Property ID is required" }, { status: 400 });
    }

    try {
        // Get coordinates from DB
        const query = `
            SELECT latitude, longitude
            FROM Property
            WHERE property_id = ?
        `;
        const result = await db.execute(query, [propertyId]);
        const rows = Array.isArray(result[0]) ? result[0] : [];

        if (!rows.length) {
            return NextResponse.json({ message: "Property not found" }, { status: 404 });
        }

        // @ts-ignore
        const { latitude, longitude } = rows[0];

        // Fetch & summarize nearby landmarks
        const nearbyPlaces = await getNearbyPlaces(latitude, longitude);
        const summary = await summarizePlacesOpenRouter(nearbyPlaces);

        return NextResponse.json({
            summary,
            places: nearbyPlaces
        });
    } catch (error) {
        console.error("Error fetching nearby places:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
