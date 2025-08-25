"use client";
import { useEffect, useState } from "react";
import { router, useRouter } from "next/navigation";
import LandlordLayout from "../../navigation/sidebar-landlord";
import LoadingScreen from "../../loadingScreen";

export default function TenantList({ landlord_id }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!landlord_id) return;

    fetch(`/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTenants(data);
        } else {
          setTenants([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching tenants:", error);
        setError("Failed to load tenants.");
        setLoading(false);
      });
  }, [landlord_id]);

  const handleViewDetails = (tenant_id) => {
    router.push(`/pages/landlord/list_of_tenants/${tenant_id}`);
  };

  if (loading) return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
        <LoadingScreen message = 'Fetching your current tenants, please wait...'/>
      </div>
  )

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="w-full px-4 py-6 lg:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-blue-600 mb-6">
          Current Tenants
        </h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Occupied
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.length > 0 ? (
                  tenants.map((tenant) => (
                    <tr key={tenant?.tenant_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {tenant?.firstName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {tenant?.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {tenant?.property_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {tenant?.unit_id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {new Date(tenant?.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {new Date(tenant?.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(tenant?.tenant_id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      <p>No active tenants found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {tenants.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <div key={tenant?.tenant_id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        {tenant?.firstName}
                      </div>
                      <button
                        onClick={() => handleViewDetails(tenant?.tenant_id)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                      >
                        Details
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Email:</div>
                      <div className="text-gray-900 truncate">
                        {tenant?.email}
                      </div>

                      <div className="text-gray-500">Property:</div>
                      <div className="text-gray-900">
                        {tenant?.property_name}
                      </div>

                      <div className="text-gray-500">Unit:</div>
                      <div className="text-gray-900">{tenant?.unit_id}</div>

                      <div className="text-gray-500">Start Date:</div>
                      <div className="text-gray-900">
                        {new Date(tenant?.start_date).toLocaleDateString()}
                      </div>

                      <div className="text-gray-500">End Date:</div>
                      <div className="text-gray-900">
                        {new Date(tenant?.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-sm text-gray-500">
                <p>No active tenants found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
