"use client";
import React, { useEffect, useState, Suspense } from "react";
import { EyeIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import useAuthStore from "../../../../zustand/authStore";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const SearchParamsWrapper = ({ setActiveTab }) => {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "pending";

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, setActiveTab]);

  return null;
};

const MaintenanceRequestPage = () => {
  const router = useRouter();
  const { fetchSession, user, admin } = useAuthStore();
  const [activeTab, setActiveTab] = useState("pending");
  const [allRequests, setAllRequests] = useState([]);
  const [visibleRequests, setVisibleRequests] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hiddenRequestCount, setHiddenRequestCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  //  Getting current tier plan. and all requests
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.landlord_id) return;

      try {
        const response = await axios.get(
          `/api/landlord/subscription/active/${user?.landlord_id}`
        );
        setSubscription(response.data);
        console.log('maintenance request data limit: ', response.data);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscription();

    const fetchRequests = async () => {
      if (!user?.landlord_id) return;

      try {
        const response = await axios.get(
          `/api/maintenance/getAllMaintenance?landlord_id=${user?.landlord_id}`
        );

        if (response.data.success) {
          setAllRequests(response.data.data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching maintenance requests:", error);
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  useEffect(() => {
    if (!subscription || !allRequests.length) return;

    const filteredByTab = allRequests.filter(
      (req) => req.status.toLowerCase() === activeTab
    );

    const { maxMaintenanceRequest } = subscription.listingLimits || {
      maxMaintenanceRequest: 5,
    };

    if (activeTab === "completed") {
      setVisibleRequests(filteredByTab);
      setHiddenRequestCount(0);
      return;
    }

    const completedRequests = allRequests.filter(
      (request) => request.status.toLowerCase() === "completed"
    );

    const activeRequests = allRequests.filter(
      (request) => request.status.toLowerCase() !== "completed"
    );

    const sortedActiveRequests = [...activeRequests].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const visibleActiveCount = Math.min(
      maxMaintenanceRequest === Infinity
        ? activeRequests.length
        : maxMaintenanceRequest,
      activeRequests.length
    );

    const visibleActiveRequestIds = sortedActiveRequests
      .slice(0, visibleActiveCount)
      .map((req) => req.request_id);

    const visibleTabRequests = filteredByTab.filter((req) => {
      if (req.status.toLowerCase() === "completed") return true;

      return visibleActiveRequestIds.includes(req.request_id);
    });

    setVisibleRequests(visibleTabRequests);

    const hiddenTabRequests =
      activeTab !== "completed"
        ? filteredByTab.length - visibleTabRequests.length
        : 0;

    setHiddenRequestCount(hiddenTabRequests);
  }, [allRequests, subscription, activeTab]);

  const updateStatus = async (request_id, newStatus, additionalData = {}) => {
    try {
      await axios.put("/api/maintenance/updateStatus", {
        request_id,
        status: newStatus,
        ...additionalData,
        user_id: user?.user_id,
        landlord_id: user?.landlord_id,
      });

      await axios.post("/api/maintenance/sendNotification", {
        request_id,
        status: newStatus,
        landlord_id: user?.landlord_id,
      });

      setAllRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.request_id === request_id
            ? { ...req, status: newStatus, ...additionalData }
            : req
        )
      );
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  const handleStartClick = (request_id) => {
    setCurrentRequestId(request_id);
    setShowCalendar(true);
  };

  const handleScheduleConfirm = () => {
    if (currentRequestId) {
      updateStatus(currentRequestId, "in-progress", {
        schedule_date: selectedDate.toISOString().split("T")[0],
      });

      setShowCalendar(false);
      setCurrentRequestId(null);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper setActiveTab={setActiveTab} />
      <div className="p-6 w-full bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-900 mb-2 sm:mb-0">
            Maintenance Requests
          </h1>
          <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200">
            <span className="font-medium">Subscription:</span>{" "}
            {subscription?.plan_name}
            <span className="mx-2">|</span>
            <span className="font-medium">Request Limit:</span>{" "}
            {subscription?.listingLimits?.maxMaintenanceRequest}
          </div>
        </div>


        {hiddenRequestCount > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
            <strong>Note:</strong> {hiddenRequestCount} maintenance request
            {hiddenRequestCount !== 1 ? "s" : ""}{" "}
            {hiddenRequestCount !== 1 ? "are" : "is"} hidden due to your plan
            limit. Complete some active requests to view these or upgrade your
            plan.
          </div>
        )}

        <div className="mb-6 border-b border-gray-200 bg-white rounded-t-lg flex">
          {["pending", "scheduled", "in-progress", "completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 font-medium text-sm ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Requests
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">Loading requests...</div>
        ) : visibleRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No {activeTab} maintenance requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Name",
                    "Property / Unit",
                    "Category",
                    "Date",
                    "Photo",
                    "Status",
                    "Action",
                    "View",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleRequests.map((request) => (
                  <tr key={request.request_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {request.tenant_first_name} {request.tenant_last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {request.property_name} / {request.unit_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {request.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.created_at).toISOString().split("T")[0]}
                    </td>
                    <td className="px-6 py-4">
                      {request.photo_urls && request.photo_urls.length > 0 ? (
                        <a
                          href={request.photo_urls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={request.photo_urls[0]}
                            alt="Maintenance Photo"
                            className="h-10 w-10 rounded"
                          />
                        </a>
                      ) : (
                        "No Photos"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full bg-gray-200`}
                      >
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === "pending" && (
                        <button
                          onClick={() =>
                            updateStatus(request.request_id, "scheduled")
                          }
                          className="px-2 py-1 bg-green-500 text-white rounded-md"
                        >
                          Approve
                        </button>
                      )}
                      {activeTab === "scheduled" && (
                        <button
                          onClick={() => handleStartClick(request.request_id)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded-md"
                        >
                          Start
                        </button>
                      )}
                      {activeTab === "in-progress" && (
                        <button
                          onClick={() =>
                            updateStatus(request.request_id, "completed", {
                              completion_date: new Date()
                                .toISOString()
                                .split("T")[0],
                            })
                          }
                          className="px-2 py-1 bg-blue-500 text-white rounded-md"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showCalendar && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] max-w-full">
              <h2 className="text-lg font-bold mb-4">Select Scheduled Date</h2>

              <Calendar onChange={setSelectedDate} value={selectedDate} />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleScheduleConfirm}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md mr-2"
                >
                  Confirm & Schedule
                </button>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              
              <div className="flex justify-between items-center border-b p-4 bg-blue-50">
                <h2 className="text-xl font-bold text-blue-900 flex items-center">
                  <span className="mr-2">Maintenance Request</span>
                </h2>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedRequest.status.toLowerCase() === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedRequest.status.toLowerCase() === "scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : selectedRequest.status.toLowerCase() === "in-progress"
                        ? "bg-purple-100 text-purple-800"
                        : selectedRequest.status.toLowerCase() === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedRequest.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:bg-gray-100 p-1 rounded-full transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              
              <div className="overflow-y-auto p-6 flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="md:col-span-2 space-y-5">
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-lg mb-3 text-blue-900">
                        {selectedRequest.subject}
                      </h3>
                      <div className="bg-gray-50 p-3 rounded text-gray-700 mb-4">
                        <p>{selectedRequest.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mt-1 mr-2 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <div>
                            <p className="text-gray-500">Submitted On</p>
                            <p className="font-medium">
                              {new Date(
                                selectedRequest.created_at
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mt-1 mr-2 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          <div>
                            <p className="text-gray-500">Category</p>
                            <p className="font-medium">
                              {selectedRequest.category}
                            </p>
                          </div>
                        </div>

                        {selectedRequest.schedule_date && (
                          <div className="flex items-start">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mt-1 mr-2 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <p className="text-gray-500">Scheduled For</p>
                              <p className="font-medium">
                                {new Date(
                                  selectedRequest.schedule_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedRequest.completion_date && (
                          <div className="flex items-start">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mt-1 mr-2 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <p className="text-gray-500">Completed On</p>
                              <p className="font-medium">
                                {new Date(
                                  selectedRequest.completion_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    
                    {selectedRequest.photo_urls &&
                      selectedRequest.photo_urls.length > 0 && (
                        <div className="bg-white rounded-lg border p-4">
                          <h3 className="font-semibold text-gray-700 mb-3">
                            Photos ({selectedRequest.photo_urls.length})
                          </h3>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {selectedRequest.photo_urls.map((photo, index) => (
                              <div
                                key={index}
                                className="relative group cursor-pointer h-24 overflow-hidden rounded-lg border"
                                onClick={() => setSelectedImage(photo)}
                              >
                                <img
                                  src={photo}
                                  alt={`Maintenance issue ${index + 1}`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Property Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mt-1 mr-2 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                          <div>
                            <p className="text-gray-500 text-sm">Property</p>
                            <p className="font-medium">
                              {selectedRequest.property_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mt-1 mr-2 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-gray-500 text-sm">Unit</p>
                            <p className="font-medium">
                              {selectedRequest.unit_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Tenant Information
                      </h3>
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedRequest.tenant_first_name}{" "}
                            {selectedRequest.tenant_last_name}
                          </p>
                          {selectedRequest.tenant_email && (
                            <p className="text-sm text-gray-500">
                              {selectedRequest.tenant_email}
                            </p>
                          )}
                          {selectedRequest.tenant_phone && (
                            <p className="text-sm text-gray-500">
                              {selectedRequest.tenant_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Actions
                      </h3>
                      <div className="space-y-2">
                        {selectedRequest.status.toLowerCase() === "pending" && (
                          <button
                            onClick={() => {
                              updateStatus(
                                selectedRequest.request_id,
                                "scheduled"
                              );
                              setShowModal(false);
                            }}
                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center"
                          >
                            Approve Request
                          </button>
                        )}

                        {selectedRequest.status.toLowerCase() ===
                          "scheduled" && (
                          <button
                            onClick={() => {
                              handleStartClick(selectedRequest.request_id);
                              setShowModal(false);
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center"
                          >
                            Start Work
                          </button>
                        )}

                        {selectedRequest.status.toLowerCase() ===
                          "in-progress" && (
                          <button
                            onClick={() => {
                              updateStatus(
                                selectedRequest.request_id,
                                "completed",
                                {
                                  completion_date: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                }
                              );
                              setShowModal(false);
                            }}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center justify-center"
                          >
                            Mark as Completed
                          </button>
                        )}

                        <button
                          onClick={() => setShowModal(false)}
                          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Enlarged maintenance photo"
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        )}
      </div>
    </Suspense>
  );
};

const MaintenanceRequest = () => {
  return (
    <LandlordLayout>
      <MaintenanceRequestPage />
    </LandlordLayout>
  );
};

export default MaintenanceRequest;
