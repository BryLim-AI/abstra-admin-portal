"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import furnishingTypes from "../../../../../../../../constant/furnishingTypes";
import { AiOutlineArrowLeft } from "react-icons/ai";
import LandlordLayout from "../../../../../../../../components/navigation/sidebar-landlord";
import Image from "next/image";
import AmenitiesSelector from "../../../../../../../../components/landlord/properties/unitAmenities";

const EditUnit = () => {
  const router = useRouter();
  const { unitId } = useParams();

  const [unit, setUnit] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({
    unitName: "",
    unitSize: "",
    bedSpacing: "",
    availBeds: "",
    rentAmt: "",
    furnish: "",
    secDeposit: "",
    advancedPayment: "",
    status: "unoccupied",
    amenities: [],
  });
  const [newPhotos, setNewPhotos] = useState([]);

  useEffect(() => {
    if (!unitId) return;

    async function fetchData() {
      try {
        // Fetch unit details
        const { data } = await axios.get(
          `/api/unitListing/getUnitListings?unit_id=${unitId}`
        );

        console.log("Unit data:", data);

        if (data.length > 0) {
          const unitData = data[0];

          setUnit(unitData);
          setFormData({
            unitName: unitData.unit_name || "",
            unitSize: unitData.unit_size || "",
            bedSpacing: unitData.bed_spacing || "",
            availBeds: unitData.avail_beds || "",
            rentAmt: unitData.rent_amount || "",
            secDeposit: unitData.sec_deposit || "",
            advancedPayment: unitData.advanced_payment || "",
            furnish: furnishingTypes.some((p) => p.value === unitData.furnish)
              ? unitData.furnish
              : "",
            amenities:unitData.amenities?
                unitData.amenities.split(",").map((amenities) => amenities.trim()):[],
          });
        } else {
          console.warn("No unit found for the given unit ID.");
        }

        // Fetch unit photos
        const { data: photoData } = await axios.get(
          `/api/unitListing/getUnitPhotos?unit_id=${unitId}`
        );

        console.log("Photo data:", photoData);

        setPhotos(photoData || []);
      } catch (error) {
        console.error("Error fetching unit:", error);
      }
    }

    fetchData();
  }, [unitId]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAmenityChange = (amenity) => {
    const currentAmenities = Array.isArray(formData.amenities)
        ? formData.amenities
        : [];
    const amenityIndex = currentAmenities.indexOf(amenity);

    let newAmenities;

    if (amenityIndex > -1) {
      newAmenities = [
        ...currentAmenities.slice(0, amenityIndex),
        ...currentAmenities.slice(amenityIndex + 1),
      ];
    } else {
      // Amenity doesn't exist, so add it
      newAmenities = [...currentAmenities, amenity];
    }

    setFormData((prev) => ({ ...prev, amenities: newAmenities }));
    setProperty({ amenities: newAmenities });
  };

  // ✅ Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos(files);
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    const viewUnitURL = `/pages/landlord/property-listing/view-unit/${unit.property_id}`;

    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this unit?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Update unit details
          await axios.put(`/api/unitListing/updateUnitListing?id=${unitId}`, formData);

          // If new photos were selected, upload them
          if (newPhotos.length > 0) {
            const photoFormData = new FormData();
            photoFormData.append("unit_id", unitId);
            newPhotos.forEach((file) => {
              photoFormData.append("files", file);
            });

            await axios.post(`/api/unitListing/addUnit/UnitPhotos`, photoFormData);
          }

          Swal.fire("Updated!", "Unit updated successfully.", "success").then(
            () => {
              router.push(viewUnitURL);
              router.refresh();
            }
          );
        } catch (error) {
          console.error("Error updating unit:", error);
          Swal.fire("Error", "Failed to update unit", "error");
        }
      }
    });
  };

  // Delete a photo
  const handleDeletePhoto = async (photoId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This photo will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`/api/unitListing/unitPhoto?id=${photoId}`);
          setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
          Swal.fire("Deleted!", "The photo has been deleted.", "success");
        } catch (error) {
          console.error("Error deleting photo:", error);
          Swal.fire("Error", "Failed to delete photo", "error");
        }
      }
    });
  };

  const handleCancel = () => {
    router.push(
      `/pages/landlord/property-listing/view-unit/${unit.property_id}`
    );
  };

  if (!unit) return <p>Loading...</p>;

  return (
    <LandlordLayout>
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10 relative">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-2 left-2 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <AiOutlineArrowLeft size={30} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Page Title */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
          Edit Unit
        </h2>

        <form onSubmit={handleUpdateUnit} className="space-y-4">
          {/* Unit Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit Name
            </label>
            <input
              type="text"
              name="unitName"
              value={formData.unitName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Unit Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit Size (sqm)
            </label>
            <input
              type="number"
              name="unitSize"
              value={formData.unitSize}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Rent Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rent Amount
            </label>
            <input
              type="number"
              name="rentAmt"
              value={formData.rentAmt}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Security Deposit */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Security Deposit
            </label>
            <input
              type="number"
              name="secDeposit"
              value={formData.secDeposit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Advanced Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Advanced Payment
            </label>
            <input
              type="number"
              name="advancedPayment"
              value={formData.advancedPayment}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Furnishing Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Furnish Type
            </label>
            <select
              name="furnish"
              value={formData.furnish}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="" disabled>
                Select Furnish Type
              </option>
              {furnishingTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <AmenitiesSelector
                selectedAmenities={formData.amenities}
                onAmenityChange={handleAmenityChange}
            />
          </div>

          {/* Bed Spacing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Features
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="bedSpacing"
                checked={formData.bedSpacing}
                onChange={handleChange}
                className="h-5 w-5"
              />
              <label className="text-gray-700">
                Bed Spacing (if applicable)
              </label>
            </div>

            {formData.bedSpacing && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700">
                  Available Bed Spacing
                </label>
                <input
                  type="number"
                  name="availBeds"
                  value={formData.availBeds || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
          </div>

          {/* Unit Photos */}
          <h3 className="text-xl font-bold mt-6">Unit Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <Image
                  src={photo.photo_url}
                  alt="Unit"
                  width={160}
                  height={160}
                  className="rounded-md object-cover w-[160px] h-[160px] border"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs shadow hover:bg-red-600 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* File Input (Inside Form) */}
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="border p-2 w-full mt-4"
          />

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md mr-3"
          >
            Save Changes
          </button>
          <button
            type="button"
            className="bg-white text-gray-700 border border-gray-500 px-4 py-2 rounded-md hover:bg-gray-200"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </form>
      </div>
    </LandlordLayout>
  );
};

export default EditUnit;
