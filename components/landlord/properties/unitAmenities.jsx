"use client";

import { AMENITIES_LIST_UNIT } from "../../../constant/unitAmenities";

const AmenitiesSelector = ({ selectedAmenities, onAmenityChange }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Select Amenities</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {AMENITIES_LIST_UNIT.map(({ name, icon }) => {
          const isSelected = selectedAmenities.includes(name);
          return (
            <button
              type="button"
              key={name}
              onClick={() => onAmenityChange(name)}
              className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-lg text-sm shadow-sm
                ${isSelected ? "bg-blue-500 text-white" : "bg-white text-gray-700"}
                hover:bg-blue-100 transition`}
            >
              <div className="text-2xl">{icon}</div>
              <span className="text-center">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AmenitiesSelector;
