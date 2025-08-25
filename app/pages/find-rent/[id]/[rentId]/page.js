"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import InquiryBooking from "../../../../../components/tenant/find-rent/inquiry";
import Image from "next/image";
import useAuth from "../../../../../hooks/useSession";
import { IoArrowBackOutline } from "react-icons/io5";
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaSwimmingPool,
  FaWifi,
  FaRuler,
  FaCouch,
  FaBed,
  FaShieldAlt,
  FaCalendarAlt,
  FaHome,
} from "react-icons/fa";
import { BsCheckCircleFill, BsImageAlt } from "react-icons/bs";
import { MdVerified, MdOutlineApartment } from "react-icons/md";
import ReviewsList from "../../../../../components/tenant/reviewList";

export default function PropertyUnitDetailedPage() {
  const router = useRouter();
  const { rentId, id } = useParams();
  const { user } = useAuth();

  const [unit, setUnit] = useState(null);
  const [property, setProperty] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!rentId) return;

    async function fetchUnitDetails() {
      try {
        const res = await fetch(
          `/api/properties/findRent/viewPropUnitDetails?rentId=${rentId}`
        );
        if (!res.ok) throw new Error("Failed to fetch unit details");
        const data = await res.json();
        console.log("unit data:", data);

        setUnit(data.unit);
        setPhotos(data.photos);

        if (data.property) {
          setProperty(data.property);
        } else {
          fetchPropertyDetails(data.unit.property_id || id);
        }
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchPropertyDetails(propertyId) {
      try {
        const res = await fetch(
          `/api/properties/findRent/viewPropertyDetails?id=${propertyId}`
        );
        if (!res.ok) throw new Error("Failed to fetch property details");
        const data = await res.json();
        setProperty(data);
      } catch (error) {
        console.error("Failed to fetch property details:", error.message);
      }
    }

    fetchUnitDetails();
  }, [rentId, id]);

  const parseAmenities = (amenitiesString) => {
    if (!amenitiesString) return [];
    return amenitiesString.split(",").map((item) => item.trim());
  };

  const getAmenityIcon = (amenity) => {
    const lowerCaseAmenity = amenity.toLowerCase();
    if (lowerCaseAmenity.includes("pool")) return <FaSwimmingPool />;
    if (
      lowerCaseAmenity.includes("wifi") ||
      lowerCaseAmenity.includes("internet")
    )
      return <FaWifi />;
    return <BsCheckCircleFill />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Unit Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the unit you're looking for.
          </p>
          <button
            onClick={() => router.push(`/pages/find-rent`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Property
          </button>
        </div>
      </div>
    );
  }

  const isOccupied = unit.status === "occupied";
  const amenities = unit ? parseAmenities(unit.amenities) : [];

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Header Section */}
      <div className="w-full bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-800">
                  {property?.property_name} - Unit {unit?.unit_name}
                </h1>
                <MdVerified className="ml-2 text-blue-500 text-xl" />
              </div>
              <p className="text-gray-600 mt-1">
                {property?.city},{" "}
                {property?.province
                  ?.split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold text-2xl text-blue-600">
                ₱{unit?.rent_amount?.toLocaleString()}
                <span className="text-sm text-gray-500"> /month</span>
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  isOccupied
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {isOccupied ? "Occupied" : "Available"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Section */}
      <div className="container mx-auto px-4 py-6">
        {photos.length > 0 ? (
          <div className="relative">
            <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg relative">
              <Image
                src={photos[activeImage]}
                alt={`Unit Image`}
                fill
                loading="lazy"
                className="object-cover"
              />
            </div>

            {photos.length > 1 && (
              <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer transition transform hover:scale-105 ${
                      activeImage === index
                        ? "ring-2 ring-blue-500"
                        : "opacity-80"
                    }`}
                    onClick={() => setActiveImage(index)}
                  >
                    <Image
                      src={photo}
                      alt={`Unit Thumbnail ${index + 1}`}
                      fill
                      loading="lazy"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <BsImageAlt className="text-4xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No Unit Images Available</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <IoArrowBackOutline className="text-2xl" />
            <span className="ml-2 text-lg font-medium">Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Unit & Property Details */}
          <div className="lg:col-span-2">
            {/* Unit Overview - Matching Property Details Style */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 pl-12 relative">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <MdOutlineApartment className="mr-2 text-blue-500" />
                Unit Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Unit Name</h3>
                  <p className="text-gray-600">Unit {unit?.unit_name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Unit Size</h3>
                  <p className="text-gray-600">{unit?.unit_size} sqm</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Furnishing</h3>
                  <p className="text-gray-600">
                    {unit?.furnish
                      ?.split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Bed Spacing</h3>
                  <p className="text-gray-600">
                    {unit?.bed_spacing === 0 ? "No" : "Yes"}
                  </p>
                </div>
                {unit?.bed_spacing !== 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700">
                      Available Beds
                    </h3>
                    <p className="text-gray-600">{unit?.avail_beds}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-700">
                    Security Deposit
                  </h3>
                  <p className="text-gray-600">
                    ₱{unit?.sec_deposit}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">
                    Advanced Payment
                  </h3>
                  <p className="text-gray-600">
                    ₱{unit?.advanced_payment}
                  </p>
                </div>
              </div>
            </div>

            {/* Property Amenities */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 pl-12 relative">
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                  <FaInfoCircle className="mr-2 text-blue-500" />
                  Unit Amenities
                </h2>

                <div className="flex flex-wrap gap-3">
                  {amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                    >
                      {getAmenityIcon(amenity)}
                      <span className="ml-2">{amenity}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>

          {/* Right Column - Booking & Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 mb-6">
              {isOccupied ? (
                <>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="text-red-500 text-xl mt-0.5 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-red-800 mb-2">
                          Unit Currently Occupied
                        </h3>
                        <p className="text-gray-700 text-sm">
                          This unit is currently rented and not available for
                          booking. You can browse other available units in this
                          property.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => router.push(`/pages/find-rent/${id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full"
                    >
                      View Available Units
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-4 text-blue-800">
                    Book This Unit
                  </h3>
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-green-800 font-medium">
                        Available for booking
                      </span>
                    </div>
                  </div>

                  {user && user.tenant_id ? (
                    <InquiryBooking
                      tenant_id={user.tenant_id}
                      unit_id={unit?.unit_id}
                      rent_amount={unit?.rent_amount}
                      landlord_id={unit?.landlord_id}
                    />
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium mb-2">
                        Login Required
                      </p>
                      <p className="text-gray-600 text-sm mb-3">
                        You must be logged in as a tenant to book this unit.
                      </p>
                      <button
                        onClick={() =>
                          router.push(
                            "/login?redirect=" +
                              encodeURIComponent(window.location.pathname)
                          )
                        }
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Log In or Sign Up
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Quick Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-2">Quick Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-blue-500">
                    <span className="text-gray-700 font-medium">
                      Monthly Rent:
                    </span>
                    <span className="font-bold text-blue-600">
                      ₱{unit?.rent_amount?.toLocaleString()} / month
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Security Deposit:</span>
                    <span className="font-medium">
                      ₱{unit?.sec_deposit?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Advanced Payment:</span>
                    <span className="font-medium">
                      ₱{unit?.advanced_payment?.toLocaleString()}
                    </span>
                  </div>
                  {property?.min_stay && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Minimum Stay:</span>
                      <span className="font-medium">
                        {property.min_stay} month
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <ReviewsList
            unit_id={unit?.unit_id}
            landlord_id={user?.landlord_id}
          />
        </div>
      </div>
    </div>
  );
}
