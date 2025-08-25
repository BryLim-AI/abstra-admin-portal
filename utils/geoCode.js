export const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
        if (!window.google) {
            reject("Google Maps not loaded");
            return;
        }

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results[0]) {
                const place = results[0];
                const location = place.geometry.location;
                const components = place.address_components || [];

                const result = {
                    lat: location.lat(),
                    lng: location.lng(),
                    address: place.formatted_address,
                    barangay: "",
                    city: "",
                    province: "",
                    region: "",
                    postcode: "",
                };

                for (const comp of components) {
                    const types = comp.types;
                    if (types.includes("postal_code")) result.postcode = comp.long_name;
                    if (types.includes("administrative_area_level_1")) result.province = comp.long_name;
                    if (types.includes("administrative_area_level_2")) result.city = comp.long_name;
                    if (types.includes("sublocality_level_1") || types.includes("neighborhood")) result.barangay = comp.long_name;
                }

                resolve(result);
            } else {
                reject("Geocoding failed: " + status);
            }
        });
    });
};
