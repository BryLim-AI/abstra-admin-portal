"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../../../zustand/authStore";
import Swal from "sweetalert2";
import SideNavProfile from "../../../../components/navigation/sidebar-profile";

const PropertyVisits = () => {
  const { fetchSession, user, admin } = useAuthStore();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  useEffect(() => {
    if (!user?.tenant_id) return;

    const fetchVisits = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/property-finder/viewBookings?tenant_id=${user?.tenant_id}`
        );
        setVisits(response.data);
      } catch (error) {
        console.error("Error fetching visits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [user]);

  const handleMarkAttendance = async (visitId, attended) => {
    try {
      await axios.put(
        "/api/tenant/property-finder/viewBookings/markAttendance",
        {
          visit_id: visitId,
          attended: attended,
        }
      );

      setVisits((prevVisits) =>
        prevVisits.map((visit) =>
          visit.visit_id === visitId ? { ...visit, attended: attended } : visit
        )
      );

      Swal.fire({
        title: "Success!",
        text: `Visit marked as ${attended ? "attended" : "no show"}.`,
        icon: "success",
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      Swal.fire(
        "Error",
        "Failed to update attendance. Try again later.",
        "error"
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status, attended) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            ✓ Confirmed
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
            Cancelled
          </span>
        );
      case "completed":
        if (attended === true) {
          return (
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Attended
            </span>
          );
        } else if (attended === false) {
          return (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              ✗ No Show
            </span>
          );
        } else {
          return (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              Completed
            </span>
          );
        }
      default:
        return (
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
            {status}
          </span>
        );
    }
  };

  const upcomingVisits = visits.filter(
    (visit) => visit.status === "approved" || visit.status === "pending"
  );

  const pastVisits = visits.filter(
    (visit) => visit.status === "completed" || visit.status === "cancelled"
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <SideNavProfile />
      <div className="flex-grow">
        <div className="bg-white">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              My Property Visits
            </h1>
            <p className="text-gray-600">
              Keep track of your scheduled property viewings
            </p>
          </div>
        </div>

        <div className="px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading your visits...</p>
              </div>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-500"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No property visits yet
              </h3>
              <p className="text-gray-500">
                Start exploring properties and book your first visit
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {upcomingVisits.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
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
                          d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0h8m-8 0V6a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Upcoming Visits
                      </h2>
                      <p className="text-gray-600">
                        You have {upcomingVisits.length} upcoming property{" "}
                        {upcomingVisits.length === 1 ? "visit" : "visits"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {upcomingVisits.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
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
                          d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0h8m-8 0V6a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Upcoming Visits
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {upcomingVisits.map((visit) => (
                      <div
                        key={visit?.visit_id}
                        className="bg-white border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                              {visit?.property_name}
                            </h4>
                            <p className="text-gray-600 mb-3">
                              {visit?.unit_name}
                            </p>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            {getStatusBadge(visit?.status, visit?.attended)}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg
                              className="w-4 h-4 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0h8m-8 0V6a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1"
                              />
                            </svg>
                            <span className="font-medium">
                              {formatDate(visit?.visit_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg
                              className="w-4 h-4 text-blue-500"
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
                            <span>{formatTime(visit?.visit_time)}</span>
                          </div>
                        </div>

                        {visit?.disapproval_reason && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <span className="font-medium">Note:</span>{" "}
                              {visit?.disapproval_reason}
                            </p>
                          </div>
                        )}

                        {visit?.status === "completed" &&
                          visit?.attended === undefined && (
                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                              <button
                                onClick={() =>
                                  handleMarkAttendance(visit?.visit_id, false)
                                }
                                className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                              >
                                Mark No Show
                              </button>
                              <button
                                onClick={() =>
                                  handleMarkAttendance(visit?.visit_id, true)
                                }
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                Mark Attended
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pastVisits.length > 0 && (
                <div className="pt-4">
                  <details className="group">
                    <summary className="cursor-pointer list-none mb-4">
                      <div className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <svg
                          className="w-4 h-4 group-open:rotate-90 transition-transform"
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
                        <span className="font-medium">
                          Past Visits ({pastVisits.length})
                        </span>
                      </div>
                    </summary>
                    <div className="space-y-3">
                      {pastVisits.map((visit) => (
                        <div
                          key={visit?.visit_id}
                          className="bg-gray-50 border border-gray-100 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">
                                {visit?.property_name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {visit?.unit_name}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{formatDate(visit?.visit_date)}</span>
                                <span>{formatTime(visit?.visit_time)}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              {getStatusBadge(visit?.status, visit?.attended)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyVisits;
