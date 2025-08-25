"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import useAuth from "../../../../../../hooks/useSession";
import Swal from "sweetalert2";

export default function EditAnnouncement() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    property_id: "",
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    async function fetchData() {
      if (!user?.landlord_id || !id) return;

      console.log("Sending Update Request:", {
        subject: formData.subject,
        description: formData.description,
        property_id: formData.property_id,
      });

      try {
        // Fetch announcement details
        const announcementRes = await fetch(
          `/api/landlord/announcement/viewAnnouncementbyId?id=${id}`
        );
        if (!announcementRes.ok)
          throw new Error("Failed to fetch announcement");
        const announcementData = await announcementRes.json();

        // Fetch properties for dropdown
        const propertiesRes = await fetch(
          `/api/landlord/announcement/fetchPropertyLists?landlord_id=${user?.landlord_id}`
        );
        if (!propertiesRes.ok) throw new Error("Failed to fetch properties");
        const propertiesData = await propertiesRes.json();

        const initialData = {
          subject: announcementData.subject,
          description: announcementData.description,
          property_id: announcementData.property_id,
        };

        setFormData(initialData);
        setOriginalData(initialData);
        setProperties(propertiesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          "Failed to load announcement data. Please refresh and try again."
        );
        Swal.fire({
          icon: "error",
          title: "Loading Error",
          text: "Unable to load announcement details. Please refresh the page and try again.",
          confirmButtonColor: "#3B82F6",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, id]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

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
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (!formData.property_id) {
      setError("Please select a property");
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
        `/api/landlord/announcement/updateAnnouncement?id=${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: formData.subject,
            description: formData.description,
            property_id: formData.property_id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update announcement");
      }

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Announcement updated successfully.",
        confirmButtonColor: "#3B82F6",
        timer: 2000,
        timerProgressBar: true,
      });

      router.push(`/pages/landlord/announcement/${id}`);
    } catch (error) {
      console.error("Error updating announcement:", error);
      setError(error.message || "Failed to update announcement");
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error.message || "Unable to update announcement. Please try again.",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Swal.fire({
        title: "Discard Changes?",
        text: "You have unsaved changes. Are you sure you want to leave?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DC2626",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Discard Changes",
        cancelButtonText: "Keep Editing",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push(`/pages/landlord/announcement/${id}`);
        }
      });
    } else {
      router.push(`/pages/landlord/announcement/${id}`);
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
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

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href={`/pages/landlord/announcement/${id}`}
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
              <span className="font-medium">Back to Announcement</span>
            </Link>

            {hasChanges && (
              <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span>Unsaved changes</span>
              </div>
            )}
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Edit Announcement
                  </h1>
                  <p className="text-sm text-gray-600">
                    Update announcement details and settings
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
                    htmlFor="property_id"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Property *
                  </label>
                  <div className="relative">
                    <select
                      id="property_id"
                      name="property_id"
                      value={formData.property_id}
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
                  <p className="mt-2 text-sm text-gray-500">
                    {formData.description.length} characters
                  </p>
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
                    disabled={saving || !hasChanges}
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
                        <span>Saving Changes...</span>
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>Save Changes</span>
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
                  Editing Tips
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Make sure your subject is clear and descriptive</li>
                  <li>• Include all relevant details in the description</li>
                  <li>
                    • Select the correct property for targeted announcements
                  </li>
                  <li>
                    • Changes are automatically saved when you click "Save
                    Changes"
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
