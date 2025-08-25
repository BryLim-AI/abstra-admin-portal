import AmenitiesSelector from "../../../amenities-selector";
import useEditPropertyStore from "../../../../zustand/property/useEditPropertyStore";

export function StepTwoEdit() {
    // @ts-ignore
    const { property, setProperty } = useEditPropertyStore();

    const handleAmenityChange = (amenity: string) => {
        const currentAmenities = property.amenities || [];
        const amenityIndex = currentAmenities.indexOf(amenity);
        let newAmenities;

        if (amenityIndex > -1) {
            newAmenities = [
                ...currentAmenities.slice(0, amenityIndex),
                ...currentAmenities.slice(amenityIndex + 1),
            ];
        } else {
            newAmenities = [...currentAmenities, amenity];
        }

        setProperty({ amenities: newAmenities });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">
                Update your property's amenities
            </h2>
            <p className="text-gray-600 mb-6">
                Select the amenities available in your place.
            </p>

            <div className="mb-8">
                <AmenitiesSelector
                    selectedAmenities={property.amenities || []}
                    onAmenityChange={handleAmenityChange}
                />
            </div>
        </div>
    );
}
