"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import TenantLayout from "../../../../../components/navigation/sidebar-tenant";
import useAuth from "../../../../../hooks/useSession";

export default function MaintenanceHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedRequests = async () => {
      try {
        const response = await axios.get(
          `/api/maintenance/viewHistory?tenant_id=${user?.tenant_id}`
        );
        setHistory(response.data);

        console.log("Fetched Maintenance History:", response.data);
      } catch (error) {
        console.error("Error fetching maintenance history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedRequests();
  }, [user]);

  return (
    <TenantLayout>
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">
          Maintenance History
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-500">
            No completed maintenance requests found.
          </p>
        ) : (
          <div className="flex flex-col space-y-4">
            {history.map((request) => (
              <div
                key={request?.request_id}
                className="bg-white shadow-md rounded-lg p-4 space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {request?.subject}
                  </h3>
                  <p className="text-gray-600">{request?.description}</p>
                  <p className="text-sm text-gray-500">
                    Property:{" "}
                    <span className="font-medium">
                      {request?.property_name}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Unit:{" "}
                    <span className="font-medium">{request?.unit_name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Category:{" "}
                    <span className="font-medium">{request?.category}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Status:{" "}
                    <span className="px-2 py-1 rounded-md text-white text-xs bg-green-500">
                      Completed
                    </span>
                  </p>
                </div>

                {/* Display maintenance images */}
                {request?.maintenance_photos.length > 0 ? (
                  <div className="flex space-x-2 overflow-x-auto">
                    {request?.maintenance_photos.map((photo, index) =>
                      photo ? (
                        <Image
                          key={index}
                          src={photo}
                          alt={`Maintenance photo ${index + 1}`}
                          width={100}
                          height={100}
                          className="rounded-md shadow-sm"
                        />
                      ) : (
                        <div
                          key={index}
                          className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
                        >
                          Failed to Load
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No maintenance photos available.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
