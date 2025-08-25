import React, { useEffect, useRef, useState } from "react";
import usePropertyStore from "../../zustand/property/usePropertyStore";
import { PROPERTY_TYPES } from "../../constant/propertyTypes";
import dynamic from "next/dynamic";
const PropertyMap = dynamic(() => import("../propertyMap"), { ssr: false });

export const StepOne = () => {
  const { property, setProperty } = usePropertyStore();
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState([]);

  useEffect(() => {
    if (!property.propertyType && PROPERTY_TYPES.length > 0) {
      setProperty({ propertyType: PROPERTY_TYPES[0].value });
    }
  }, [property.propertyType]);

  // Debounced OSM search for address input
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

    setCoords({ lat: parsed.lat, lng: parsed.lng });
    setProperty({ ...property, ...parsed });
    setAddressQuery(parsed.street);
    setAddressResults([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty({ ...property, [name]: value });
  };

  return (
      <div>
        <h1 className="mt-5 text-3xl font-bold mb-4">List New Property</h1>
        <p className="text-gray-600 mb-4">
          List it in the market where renters are waiting!
        </p>

        <form className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PROPERTY_TYPES.map((type) => {
                const isSelected = property.propertyType === type.value;
                return (
                    <button
                        type="button"
                        key={type.value}
                        onClick={() => setProperty({ ...property, propertyType: type.value })}
                        className={`flex flex-col items-center justify-center p-4 border rounded-lg shadow-sm text-lg transition 
            ${isSelected ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300"}
            hover:border-blue-400 hover:bg-blue-50`}
                    >
                      <span className="text-2xl mb-1">{type.icon}</span>
                      <span className="text-sm">{type.label}</span>
                    </button>
                );
              })}
            </div>
          </div>


          <div>
            <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700">
              Property Name
            </label>
            <input
                type="text"
                id="propertyName"
                name="propertyName"
                placeholder="XYZ Residences"
                value={property.propertyName || ""}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative overflow-hidden h-[400px] w-full rounded-lg border z-0">

            <PropertyMap
                coordinates={coords.lat && coords.lng ? [coords.lat, coords.lng] : null}
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
          </div>


          <p className="mt-2 text-sm text-gray-600">
            Selected Location: {coords.lat}, {coords.lng}
          </p>

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
                  {addressResults.map((result, index) => (
                      <li
                          key={index}
                          onClick={() => handleAddressSelect(result)}
                          className="p-2 hover:bg-blue-100 cursor-pointer"
                      >
                        {result.display_name}
                      </li>
                  ))}
                </ul>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600">Barangay/District</label>
            <input
                type="text"
                onChange={handleChange}
                value={property.brgyDistrict || ""}
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
