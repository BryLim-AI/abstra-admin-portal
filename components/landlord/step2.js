import AmenitiesSelector from "../amenities-selector";
import usePropertyStore from "../../zustand/property/usePropertyStore";

export function StepTwo() {
  const { property, setProperty } = usePropertyStore();

  const handleAmenityChange = (amenity) => {
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
        Tell renters what your place offers
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
