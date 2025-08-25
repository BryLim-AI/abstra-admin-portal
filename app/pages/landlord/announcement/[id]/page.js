"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import LandlordLayout from "../../../../../components/navigation/sidebar-landlord";
import useAuth from "../../../../../hooks/useSession";
import Swal from "sweetalert2";

export default function ViewAnnouncement() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      if (!user?.landlord_id || !id) return;

      try {
        console.log(
          "Fetching announcement with ID:",
          id,
          "for Landlord ID:",
          user.landlord_id
        );
        const response = await fetch(
          `/api/landlord/announcement/viewAnnouncementbyId?id=${id}`
        );
        if (!response.ok) throw new Error("Failed to fetch announcement");
        const data = await response.json();
        console.log("Fetched Announcement:", data);
        setAnnouncement(data);
      } catch (error) {
        console.error("Error fetching announcement:", error);
        Swal.fire({
          icon: "error",
          title: "Error Loading Announcement",
          text: "Unable to load announcement details. Please try again.",
          confirmButtonColor: "#3B82F6",
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.landlord_id && id) {
      fetchAnnouncement();
    }
  }, [user, id]);

  const handleEdit = () => {
    router.push(`/pages/landlord/announcement/edit/${id}`);
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Announcement?",
      text: "This action cannot be undone. The announcement will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-lg",
        title: "text-lg font-semibold",
        content: "text-sm text-gray-600",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/landlord/announcement/deleteAnnouncement?id=${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted Successfully",
        text: "The announcement has been removed.",
        confirmButtonColor: "#3B82F6",
        timer: 2000,
        timerProgressBar: true,
      });

      router.push("/pages/landlord/announcement");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: "Unable to delete announcement. Please try again.",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "No date available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto py-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center animate-pulse">
                <div className="w-5 h-5 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex gap-3">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <LoadingSkeleton />
          </div>
        </div>
      </LandlordLayout>
    );
  }

  if (!announcement) {
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
              Announcement Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The announcement you're looking for doesn't exist or has been
              removed.
            </p>
            <Link
              href="/pages/landlord/announcement"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Announcements
            </Link>
          </div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto py-6">
          {/* Header with Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
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

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleEdit}
                className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:bg-red-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 animate-spin"
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
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">
                      Announcement Details
                    </h3>
                    <p className="text-xs text-gray-500">ID: {id}</p>
                  </div>
                </div>

                {announcement.property && (
                  <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-1 shadow-sm">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {announcement.property}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="px-6 py-6">
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {announcement.subject}
              </h1>

              {/* Metadata */}
              <div className="flex items-center space-x-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Published: {formatDate(announcement.created_at)}</span>
                </div>

                {announcement.updated_at &&
                  announcement.updated_at !== announcement.created_at && (
                    <div className="flex items-center space-x-2">
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>
                        Updated: {formatDate(announcement.updated_at)}
                      </span>
                    </div>
                  )}
              </div>

              {/* Content */}
              <div className="prose prose-gray max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                  {announcement.description}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>Viewing announcement</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEdit}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Quick Edit
                  </button>
                  <span className="text-gray-300">|</span>
                  <Link
                    href="/pages/landlord/announcement"
                    className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
