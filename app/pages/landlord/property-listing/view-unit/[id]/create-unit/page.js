"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { z } from "zod";
import furnishingTypes from "../../../../../../../constant/furnishingTypes";
import LandlordLayout from "../../../../../../../components/navigation/sidebar-landlord";
import AmenitiesSelector from "../../../../../../../components/landlord/properties/unitAmenities";

// Zod validation schema
const unitSchema = z.object({
  unitName: z.string().min(1, "Unit name is required"),
  unitSize: z.string().min(1, "Unit Size is required"),
  rentAmt: z.number().min(1, "Rent amount is required"),
  furnish: z.string().min(1, "Furnishing selection is required"),
  photos: z.array(z.any()).min(1, "At least one image is required"),
});

export default function UnitListingForm() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property_id");
  const [formData, setFormData] = useState({
    property_id: propertyId || "",
    unitName: "",
    unitSize: "",
    bedSpacing: "",
    availBeds: "",
    rentAmt: "",
    furnish: "",
    secDepo:'',
    advPay:'',
    amenities: [],

  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAmenityChange = (amenityName) => {
  setFormData((prev) => {
    const isSelected = prev.amenities.includes(amenityName);
    return {
      ...prev,
      amenities: isSelected
        ? prev.amenities.filter((a) => a !== amenityName)
        : [...prev.amenities, amenityName],
    };
  });
};

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Function to handle files selected by Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop: (acceptedFiles) => {
      setPhotos((prevFiles) => [...prevFiles, ...acceptedFiles]);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedFormData = {
      ...formData,
      rentAmt: Number(formData.rentAmt),
     amenities: formData.amenities.join(","), 

    };

    // Validate form data with Zod
    const result = unitSchema.safeParse({ ...parsedFormData, photos });

    if (!result.success) {
      console.log("Validation Errors:", result.error.errors);

      Swal.fire({
        title: "Validation Error",
        text: result.error.errors.map((err) => err.message).join(", "),
        icon: "error",
      });

      return;
    }

    // Show confirmation dialog before submitting
    const confirmSubmit = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to submit this unit listing?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, submit it!",
    });

    if (!confirmSubmit.isConfirmed) {
      return;
    }

    setLoading(true);
    const propURL = `/pages/landlord/property-listing/view-unit/${propertyId}`;
    
    try {
      const unitResponse = await axios.post("/api/unitListing/addUnit", formData);

      const unitId = unitResponse.data.unitId;

      if (photos.length > 0) {
        const photoFormData = new FormData();
        photos.forEach((photo) => {
          photoFormData.append("photos", photo);
        });
        photoFormData.append("unit_id", unitId);

        const photoResponse = await axios.post(
          "/api/unitListing/addUnit/UnitPhotos",
          photoFormData
        );

        console.log("Photos uploaded:", photoResponse.data);
      }

      Swal.fire({
        title: "Success!",
        text: "Unit created successfully!",
        icon: "success",
      }).then(() => {
        router.push(propURL);
        router.refresh();
      });
    } catch (error) {
      console.error("Error creating unit:", error);
      Swal.fire({
        title: "Error!",
        text: `Error creating unit: ${error.message}`,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const propURL = `/pages/landlord/property-listing/${propertyId}/view-unit`;
    router.back(propURL);
  };

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* Create Unit Form */}

        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Create Unit
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit Name
            </label>
            <input
              type="text"
              name="unitName"
              value={formData.unitName || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Unit Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit Size
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                name="unitSize"
                value={formData.unitSize || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
              />
              <span className="absolute right-3 text-gray-500 text-sm">
                sqm
              </span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium mb-1">
              Additional Features
            </label>

            {/* Bed Spacing Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="bedSpacing"
                checked={formData.bedSpacing}
                onChange={handleChange}
                className="h-6 w-6"
              />
              <label className="text-gray-700">
                Bed Spacing (if applicable)
              </label>
            </div>

            {/* Show Input for Available Bed Spacing */}
            {formData.bedSpacing && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Available Bed Spacing (in number)
                </label>
                <input
                  type="number"
                  name="availBeds"
                  value={formData.availBeds || ""}
                  onChange={handleChange}
                  min={0}
                  placeholder="Enter available bed spacing"
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
          </div>

          {/* Rent Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rent Amount
            </label>
            <input
              type="number"
              name="rentAmt"
              value={formData.rentAmt || ""}
              onChange={handleChange}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Security Deposit (max for 2 months only)
            </label>
            <input
              type="number"
              name="secDepo"
              value={formData.secDepo || ""}
              onChange={handleChange}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Advanced Payment (max for 1 month only)
            </label>
            <input
              type="number"
              name="advPay"
              value={formData.advPay || ""}
              onChange={handleChange}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Furnish Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Furnishing
            </label>
            <select
              name="furnish"
              value={formData.furnish || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="" disabled>
                Select Furnishing
              </option>
              {furnishingTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>


<AmenitiesSelector
  selectedAmenities={formData.amenities}
  onAmenityChange={handleAmenityChange}
/>



          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`dropzone w-full p-4 border-2 border-dashed rounded-md border-gray-400 transition duration-200 ease-in-out ${
              isDragActive ? "border-blue-500" : "border-gray-400"
            } flex flex-col items-center justify-center space-y-2 cursor-pointer`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-500">Drop the unit photos here...</p>
            ) : (
              <p className="text-gray-500">
                Drag 'n' drop unit photos here, or click to select
              </p>
            )}
          </div>

          {/* Display Existing Photos */}
          {photos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Existing Photos:</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photos?.map((photo, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={URL.createObjectURL(photo)}
                      alt="Property"
                      width={100}
                      height={100}
                      className="w-full h-20 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
                      onClick={() => {
                        const newPhotos = [...photos];
                        newPhotos.splice(index, 1);
                        setPhotos(newPhotos);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Unit"}
            </button>
            <button
              type="button"
              className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}
