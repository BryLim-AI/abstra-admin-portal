"use client";
import React, { useState, useEffect } from "react";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import { useRouter, useParams } from "next/navigation";
import StepCounter4 from "../../../../../../components/landlord/properties/editProperty/stepCounter";
import { StepOneEdit } from "../../../../../../components/landlord/properties/editProperty/stepOne";
import { StepTwoEdit } from "../../../../../../components/landlord/properties/editProperty/stepTwo";
import { StepThreeEdit } from "../../../../../../components/landlord/properties/editProperty/stepThree";
import { StepFourEdit } from "../../../../../../components/landlord/properties/editProperty/stepFour";
import axios from "axios";
import useEditPropertyStore from "../../../../../../zustand/property/useEditPropertyStore";
import useAuthStore from "../../../../../../zustand/authStore";
import Swal from "sweetalert2";

export default function EditProperty() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id;
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(1);
  const { fetchSession, user, admin } = useAuthStore();

  const {
    setProperty,
    setPhotos,
  } = useEditPropertyStore();

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  // Load property data when editing
  useEffect(() => {
    if (propertyId) {
      axios
          .get(`/api/propertyListing/editProperty?property_id=${propertyId}`)
          .then((res) => {
            const data = res.data;
            if (data.length > 0) {
              const propertyData = data[0]; // take the first property
              console.log('propertyData',propertyData);
              setProperty(propertyData);
              // Optional: If you have separate files/photos
              setPhotos(propertyData.photos || []);

            } else {
              console.warn("No property found with this ID");
            }
          })
          .catch((err) => {
            console.error("Failed to load property data:", err);
            Swal.fire("Error", "Unable to load property details.", "error");
            router.push("/pages/landlord/property-listing");
          });
    }
  }, [propertyId]);

  const validateStep = (step) => {
    const { property, photos } =
        useEditPropertyStore.getState();

    if (step === 1) {
      if (
          !property.propertyName ||
          !property.street ||
          !property.brgyDistrict ||
          !property.city ||
          !property.province ||
          !property.zipCode
      ) {
        Swal.fire(
            "Missing Details",
            "Please fill in all property details before proceeding.",
            "warning"
        );
        return false;
      }

      const zipCodePattern = /^\d{4}$/;
      if (!zipCodePattern.test(property.zipCode)) {
        Swal.fire(
            "Invalid ZIP Code",
            "Zip Code must be exactly 4 digits.",
            "error"
        );
        return false;
      }
    }

    if (step === 3) {
      if (photos.length === 0 || photos.length < 3) {
        Swal.fire(
            "Insufficient Photos",
            "Please upload at least three property photos.",
            "warning"
        );
        return false;
      }

      // if (!property.propDesc || property.propDesc.trim().length === 0) {
      //   Swal.fire("Missing Description", "Please enter the description of the property", "error");
      //   return false;
      // }

      if (!property.floorArea || property.floorArea <= 0) {
        Swal.fire("Missing Floor Area", "Please enter the floor area of the property", "error");
        return false;
      }

      if (!property.minStay || property.minStay <= 0) {
        Swal.fire(
            "Missing Minimum Stay",
            "Please enter the minimum stay duration (in months).",
            "error"
        );
        return false;
      }

      if (!property.utilityBillingType || property.utilityBillingType.trim() === "") {
        Swal.fire(
            "Missing Utility Billing Type",
            "Please select a utility billing type.",
            "error"
        );
        return false;
      }

      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
      for (let photo of photos) {
        if (!allowedImageTypes.includes(photo.file?.type)) {
          Swal.fire(
              "Invalid File Type",
              "Only image files (JPEG, PNG, WEBP) are allowed for property photos.",
              "error"
          );
          return false;
        }
      }
    }

    if (step === 4) {
      if (!property.paymentFrequency || property.paymentFrequency.trim() === "") {
        Swal.fire(
            "Missing Payment Frequency",
            "Please select a payment frequency.",
            "error"
        );
        return false;
      }

      if (property.lateFee == null || property.lateFee < 0) {
        Swal.fire(
            "Missing Late Fee",
            "Please enter a valid late fee amount (0 or higher).",
            "error"
        );
        return false;
      }

      if (property.assocDues == null || property.assocDues < 0) {
        Swal.fire(
            "Missing Association Dues",
            "Please enter a valid association dues amount (0 or higher).",
            "error"
        );
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save these changes?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, save it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);

        const { property, photos } = useEditPropertyStore.getState();

        try {
          // Update property data
          await axios.put(
              `/api/propertyListing/updateProperty?property_id=${propertyId}`,
              property
          );

          // Upload new photos if any
          const newPhotos = photos.filter((photo) => photo.isNew && photo.file);

          if (newPhotos.length > 0) {
            const formDataPhotos = new FormData();
            formDataPhotos.append("property_id", propertyId);

            newPhotos.forEach((photo) => {
              formDataPhotos.append("photos", photo.file);
            });

            await axios.post("/api/propertyListing/uploadPropertyPhotos", formDataPhotos, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }

          Swal.fire("Saved!", "Your property has been updated.", "success").then(() => {
            router.push("/pages/landlord/property-listing");
          });

        } catch (error) {
          console.error("Error updating property:", error);
          Swal.fire("Error", "Failed to update property.", "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCancel = () => {
    router.push("/pages/landlord/property-listing");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepOneEdit propertyId={propertyId} />;
      case 2:
        return <StepTwoEdit />;
      case 3:
        return <StepThreeEdit propertyId={propertyId} />;
      case 4:
        return <StepFourEdit />;
      default:
        return <div>Invalid Step</div>;
    }
  };

  return (
      <div className="min-h-screen bg-gray-100">
        <LandlordLayout>
          <div className="flex">
            <main className="flex-1 p-8">
              <StepCounter4 currentStep={step} />
              <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                {renderStep()}
                <div className="flex justify-between mt-6">
                  {step > 1 && (
                      <button
                          onClick={prevStep}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Back
                      </button>
                  )}
                  {step < 4 ? (
                      <button
                          onClick={nextStep}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Next
                      </button>
                  ) : (
                      <button
                          onClick={handleSubmit}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                      >
                        Update
                      </button>
                  )}
                </div>
              </div>
            </main>
          </div>
        </LandlordLayout>
      </div>
  );
}
