"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import useEditPropertyStore from "../../../../zustand/property/useEditPropertyStore"; // separate store for editing
import { PROPERTY_TYPES } from "../../../../constant/propertyTypes";

const PropertyMap = dynamic(() => import("../../../propertyMap"), { ssr: false });

// @ts-ignore
export const StepOneEdit = ({ propertyId }) => {
    // @ts-ignore
    const { property, setProperty } = useEditPropertyStore();
    const [loading, setLoading] = useState(true);
    const [coords, setCoords] = useState({ lat: null, lng: null });
    const [addressQuery, setAddressQuery] = useState("");
    const [addressResults, setAddressResults] = useState([]);

    // Fetch property details for editing
    // Fetch property details for editing
    useEffect(() => {
        if (!propertyId) return;

        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/propertyListing/editProperty?property_id=${propertyId}`);
                if (!res.ok) throw new Error("Failed to fetch property details");

                const data = await res.json(); // data is an array
                if (data.length > 0) {
                    const propertyData = data[0]; // grab the first element

                    // Map API keys (snake_case) to store keys (camelCase)
                    const mappedProperty = {
                        propertyName: propertyData.property_name,
                        propertyType: propertyData.property_type,
                        amenities: propertyData.amenities || [],
                        street: propertyData.street,
                        brgyDistrict: propertyData.brgy_district,
                        city: propertyData.city,
                        zipCode: propertyData.zip_code,
                        province: propertyData.province,
                        propDesc: propertyData.prop_desc,
                        floorArea: propertyData.floor_area,
                        utilityBillingType: propertyData.utility_billing_type,
                        minStay: propertyData.min_stay,
                        secDeposit: propertyData.sec_deposit,
                        advancedPayment: propertyData.advanced_payment,
                        lateFee: propertyData.late_fee,
                        assocDues: propertyData.assoc_dues,
                        paymentFrequency: propertyData.payment_frequency,
                        bedSpacing: propertyData.bed_spacing,
                        availBeds: propertyData.avail_beds,
                        flexiPayEnabled: propertyData.flexi_pay_enabled,
                        paymentMethodsAccepted: propertyData.accepted_payment_methods || [],
                        propertyPreferences: propertyData.property_preferences || [],
                        lat: propertyData.lat,
                        lng: propertyData.lng,
                    };

                    setProperty(mappedProperty);
                    setCoords({ lat: mappedProperty.lat || null, lng: mappedProperty.lng || null });
                    setAddressQuery(mappedProperty.street || "");
                } else {
                    console.warn("No property found with this ID");
                }
            } catch (err) {
                console.error("Error loading property:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [propertyId]);


    // Debounced address search
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (addressQuery.length < 4) {
                setAddressResults([]);
                return;
            }
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                        addressQuery
                    )}&addressdetails=1&countrycodes=ph`
                );
                const data = await res.json();
                setAddressResults(data);
            } catch (err) {
                console.error("Address search failed", err);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [addressQuery]);

    // @ts-ignore
    const handleAddressSelect = (place) => {
        const { lat, lon, display_name, address } = place;
        const parsed = {
            lat: parseFloat(lat),
            lng: parseFloat(lon),
            street: address.road || display_name,
            brgyDistrict: address.suburb || address.neighbourhood || "",
            city: address.city || address.town || address.village || "",
            province: address.region || "",
            zipCode: address.postcode || "",
        };

        // @ts-ignore
        setCoords({ lat: parsed.lat, lng: parsed.lng });
        setProperty({ ...property, ...parsed });
        setAddressQuery(parsed.street);
        setAddressResults([]);
    };

    // @ts-ignore
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProperty({ ...property, [name]: value });
    };

    if (loading) return <p className="text-gray-500">Loading property details...</p>;

    // @ts-ignore
    // @ts-ignore
    return (
        <div>
            <h1 className="mt-5 text-3xl font-bold mb-4">Edit Property</h1>
            <p className="text-gray-600 mb-4">Update your property details below.</p>

            <form className="space-y-4">
                {/* Property Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PROPERTY_TYPES.map((type) => {
                            const isSelected = property.propertyType === type.value;
                            return (
                                <button
                                    type="button"
                                    key={type.value}
                                    onClick={() => setProperty({ ...property, propertyType: type.value })}
                                    className={`flex flex-col items-center justify-center p-4 border rounded-lg shadow-sm text-lg transition ${
                                        isSelected
                                            ? "bg-blue-500 text-white border-blue-500"
                                            : "bg-white text-gray-700 border-gray-300"
                                    } hover:border-blue-400 hover:bg-blue-50`}
                                >
                                    <span className="text-2xl mb-1">{type.icon}</span>
                                    <span className="text-sm">{type.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Property Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Property Name</label>
                    <input
                        type="text"
                        name="propertyName"
                        value={property.propertyName || ""}
                        onChange={handleChange}
                        placeholder="XYZ Residences"
                        className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Map */}
                <PropertyMap
                    coordinates={coords.lat && coords.lng ? [coords.lat, coords.lng] : null}
                    // @ts-ignore
                    setFields={({ lat, lng, address, barangay, city, province, region, postcode }) => {
                        setCoords({ lat, lng });
                        setProperty({
                            ...property,
                            lat,
                            lng,
                            street: address,
                            brgyDistrict: barangay,
                            city,
                            province: region,
                            zipCode: postcode || "",
                        });
                        setAddressQuery(address);
                    }}
                />

                <p className="mt-2 text-sm text-gray-600">
                    Selected Location: {coords.lat}, {coords.lng}
                </p>

                {/* Address Search */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input
                        type="text"
                        name="street"
                        value={addressQuery}
                        onChange={(e) => setAddressQuery(e.target.value)}
                        placeholder="Search address"
                        className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    {addressResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-auto">
                            {addressResults.map((result, idx) => (
                                <li
                                    key={idx}
                                    onClick={() => handleAddressSelect(result)}
                                    className="p-2 hover:bg-blue-100 cursor-pointer"
                                >
                                    {result.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Read-only fields */}
                <div>
                    <label className="block text-sm text-gray-600">Barangay/District</label>
                    <input
                        type="text"
                        value={property.brgyDistrict || ""}
                        readOnly
                        className="w-full p-2 bg-gray-100 border border-gray-200 rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">City / Municipality</label>
                    <input
                        type="text"
                        name="city"
                        value={property.city || ""}
                        onChange={handleChange}
                        placeholder="Enter city"
                        className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                    <input
                        type="number"
                        name="zipCode"
                        value={property.zipCode || ""}
                        onChange={handleChange}
                        placeholder="Enter zip code"
                        className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-600">Province</label>
                    <input
                        type="text"
                        value={property.province || ""}
                        readOnly
                        className="w-full p-2 bg-gray-100 border border-gray-200 rounded"
                    />
                </div>
            </form>
        </div>
    );
};
