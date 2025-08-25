"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LandlordLayout from "../../../../../components/navigation/sidebar-landlord";
import useAuth from "../../../../../hooks/useSession";
import Swal from "sweetalert2";

export default function CreateAnnouncement() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    property: "",
    subject: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProperties() {
      try {
        if (!user?.landlord_id) {
          console.error("No landlord ID found in user data");
          return;
        }

        const response = await fetch(
          `/api/landlord/announcement/fetchPropertyLists?landlord_id=${user.landlord_id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch properties");
        }

        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setError("Failed to load properties. Please refresh and try again.");
        Swal.fire({
          icon: "error",
          title: "Loading Error",
          text: "Failed to load properties. Please try again.",
          confirmButtonColor: "#3B82F6",
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.landlord_id) {
      fetchProperties();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear any existing errors when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.property) {
      setError("Please select a property");
      return false;
    }
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/landlord/announcement/createAnnouncement",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: formData.property,
            subject: formData.subject,
            description: formData.description,
            landlord_id: user.landlord_id,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Announcement created successfully.",
          confirmButtonColor: "#3B82F6",
          timer: 2000,
          timerProgressBar: true,
        });

        // Reset form
        setFormData({
          property: "",
          subject: "",
          description: "",
        });

        router.push("/pages/landlord/announcement");
      } else {
        throw new Error(data.message || "Failed to create announcement");
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      setError(error.message || "Failed to create announcement");
      Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text:
          error.message || "Failed to create announcement. Please try again.",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const hasContent =
      formData.property ||
      formData.subject.trim() ||
      formData.description.trim();

    if (hasContent) {
      Swal.fire({
        title: "Discard Changes?",
        text: "You have unsaved content. Are you sure you want to leave?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DC2626",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Discard Changes",
        cancelButtonText: "Keep Editing",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/pages/landlord/announcement");
        }
      });
    } else {
      router.push("/pages/landlord/announcement");
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-6 w-1/2"></div>
      <div className="space-y-6">
        <div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-16"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="flex justify-end gap-4">
          <div className="w-20 h-10 bg-gray-200 rounded"></div>
          <div className="w-28 h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto py-6">
            <div className="flex items-center mb-6 animate-pulse">
              <div className="w-5 h-5 bg-gray-200 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
            <LoadingSkeleton />
          </div>
        </div>
      </LandlordLayout>
    );
  }

  if (!user?.landlord_id) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-6">
              Please log in to create announcements.
            </p>
          </div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/pages/landlord/announcement"
              className="group flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg
                className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="font-medium">Back to Announcements</span>
            </Link>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Create New Announcement
                  </h1>
                  <p className="text-sm text-gray-600">
                    Share important updates with your tenants
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Property Selection */}
                <div>
                  <label
                    htmlFor="property"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Property *
                  </label>
                  <div className="relative">
                    <select
                      id="property"
                      name="property"
                      value={formData.property}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                      required
                    >
                      <option value="">Select a property</option>
                      {properties.map((property) => (
                        <option
                          key={property.property_id}
                          value={property.property_id}
                        >
                          {property.property_name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose which property this announcement applies to
                  </p>
                </div>

                {/* Subject Input */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter announcement subject..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Keep it clear and descriptive
                  </p>
                </div>

                {/* Description Textarea */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Enter detailed announcement description..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-vertical"
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      Include all relevant details and information
                    </p>
                    <span className="text-sm text-gray-400">
                      {formData.description.length} characters
                    </span>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Creating Announcement...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span>Create Announcement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Announcement Tips
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use clear, descriptive subjects to grab attention</li>
                  <li>• Include all relevant details in the description</li>
                  <li>
                    • Select the appropriate property for targeted messaging
                  </li>
                  <li>
                    • Consider the timing and urgency of your announcement
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
