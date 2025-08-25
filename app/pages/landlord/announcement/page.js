"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import useAuthStore from "../../../../zustand/authStore";
import Swal from "sweetalert2";
import LoadingScreen from "../../../../components/loadingScreen";


export default function AnnouncementsList() {
  const router = useRouter();
  const { fetchSession, user, admin } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("all");

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch(
          `/api/landlord/announcement/getAllAnnouncements?landlord_id=${user?.landlord_id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }

        const data = await response.json();
        setAnnouncements(data);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        Swal.fire({
          icon: "error",
          title: "Error Loading Announcements",
          text: "Unable to load announcements. Please check your connection and try again.",
          confirmButtonColor: "#3B82F6",
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.landlord_id) {
      fetchAnnouncements();
    }
  }, [user]);

  const handleCreate = () => {
    router.push(`/pages/landlord/announcement/create-announcement`);
  };

  if(loading) return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
        <LoadingScreen message = 'Fetching your announcements, please wait...'/>
      </div>
  )


  const uniqueProperties = [
    ...new Set(announcements.map((ann) => ann.property)),
  ];


  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty =
      selectedProperty === "all" || announcement.property === selectedProperty;
    return matchesSearch && matchesProperty;
  });


  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

 
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-24 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-3/4 h-5 bg-gray-200 rounded mb-2"></div>
              <div className="w-full h-4 bg-gray-200 rounded mb-1"></div>
              <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto py-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
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
              <h1 className="text-2xl font-bold text-gray-900">
                Announcements
              </h1>
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
        <div className="max-w-6xl mx-auto py-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
                <h1 className="text-2xl font-bold text-gray-900">
                  Announcements
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage and track your property announcements
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 w-full lg:w-auto flex items-center justify-center space-x-2"
            >
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
            </button>
          </div>

          {/* Stats and Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Total Announcements</p>
                    <p className="text-xl font-bold text-gray-900">
                      {announcements.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
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
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Properties Covered</p>
                    <p className="text-xl font-bold text-gray-900">
                      {uniqueProperties.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Filtered Results</p>
                    <p className="text-xl font-bold text-gray-900">
                      {filteredAnnouncements.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search announcements by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[180px]"
                >
                  <option value="all">All Properties</option>
                  {uniqueProperties.map((property) => (
                    <option key={property} value={property}>
                      {property}
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
          </div>

          {/* Announcements List */}
          <div className="space-y-4">
            {filteredAnnouncements.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || selectedProperty !== "all"
                    ? "No matching announcements found"
                    : "No announcements yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedProperty !== "all"
                    ? "Try adjusting your search criteria or filters."
                    : "Get started by creating your first announcement to keep tenants informed."}
                </p>
                {!searchTerm && selectedProperty === "all" && (
                  <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Create Your First Announcement
                  </button>
                )}
              </div>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-md px-2 py-1">
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
                          <span className="text-sm text-gray-700">
                            {announcement.property}
                          </span>
                        </div>
                        {announcement.created_at && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
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
                            <span>{formatDate(announcement.created_at)}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {announcement.subject}
                      </h3>

                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {announcement.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 self-start lg:self-center">
                      <Link
                        href={`/pages/landlord/announcement/${announcement.id}`}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                      >
                        <span className="text-sm font-medium">
                          View Details
                        </span>
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Results Summary */}
          {announcements.length > 0 && (
            <div className="mt-8 text-center text-gray-600">
              <p>
                Showing {filteredAnnouncements.length} of {announcements.length}{" "}
                announcement{announcements.length !== 1 ? "s" : ""}
                {(searchTerm || selectedProperty !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedProperty("all");
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-700 underline"
                  >
                    Clear filters
                  </button>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </LandlordLayout>
  );
}
