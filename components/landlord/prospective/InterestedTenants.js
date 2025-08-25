"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AiOutlineArrowLeft, AiOutlineEye } from "react-icons/ai";
import Swal from "sweetalert2";
import LoadingScreen from "../../loadingScreen";
import Image from "next/image";
import useAuthStore from "../../../zustand/authStore";

export default function InterestedTenants({ unitId, landlordId }) {
  const router = useRouter();
  const { fetchSession, user, admin } = useAuthStore();
  const [tenants, setTenants] = useState([]);
  const [visibleTenants, setVisibleTenants] = useState([]);
  const [hiddenTenants, setHiddenTenants] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Getting Landlord Subscription and List of Interested Tenants.
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!unitId || !landlordId) return;

      try {
        setLoading(true);

        if (!subscription && user?.subscription) {
          setSubscription({
            ...user?.subscription,
            plan_name: user?.subscription.plan_name || "Free Plan",
            listingLimits: {
              maxProspect:
                user?.subscription.plan_name === "Premium Plan" ? Infinity : 3,
            },
          });
        }

        if (tenants.length === 0) {
          const tenantsResponse = await axios.get(
            `/api/landlord/prospective/interestedTenants?unitId=${unitId}`
          );

          if (isMounted) {
            const tenantsData = tenantsResponse.data;
            setTenants(tenantsData);

            const maxProspects = subscription?.listingLimits?.maxProspect || 3;
            setVisibleTenants(
              maxProspects === Infinity
                ? tenantsData
                : tenantsData.slice(0, maxProspects)
            );
            setHiddenTenants(
              maxProspects === Infinity ? [] : tenantsData.slice(maxProspects)
            );
          }
        }
      } catch (err) {
        if (isMounted)
          setError(err.response?.data?.error || "Failed to load data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [unitId, landlordId]);

  const handleTenantClick = (tenant) => {
    Swal.fire({
      title: "Loading...",
      text: "Redirecting to tenant details...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    router.push(
      `/pages/landlord/property-listing/view-unit/view-tenant/${unitId}?unit_id=${unitId}&tenant_id=${tenant.tenant_id}`
    );
    Swal.close();
  };

  const handleUpgradeClick = () => {
    Swal.fire({
      title: "Upgrade Your Plan",
      text: "Upgrade to our Premium plan to see all prospective tenants!",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Upgrade Now",
      cancelButtonText: "Maybe Later",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/pages/landlord/subscription");
      }
    });
  };

  if (loading) return <LoadingScreen />;
  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-8 gap-4 sm:gap-0">
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            onClick={() => router.back()}
          >
            <AiOutlineArrowLeft className="text-xl" />
            <span className="font-medium">Back to Properties</span>
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">
            Prospective Tenants
          </h2>
        </div>

        {subscription && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              subscription.plan_name === "Premium Plan"
                ? "bg-blue-50 border border-blue-200"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div>
                <p className="font-medium">
                  {subscription?.plan_name === "Premium Plan"
                    ? "Premium Plan: Unlimited prospective tenants"
                    : `${subscription?.plan_name}: ${subscription?.listingLimits.maxProspect} prospective tenants`}
                </p>
                {hiddenTenants.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {`${hiddenTenants.length} additional tenant(s) hidden`}
                  </p>
                )}
              </div>
              {hiddenTenants.length > 0 && (
                <button
                  onClick={handleUpgradeClick}
                  className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4">
              <div className="text-sm font-medium text-gray-500">
                Visible:{" "}
                <span className="text-gray-900">{visibleTenants.length}</span>
                {hiddenTenants.length > 0 && (
                  <span className="text-amber-600">
                    {" "}
                    (+{hiddenTenants.length} hidden)
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-500">
                Approved:{" "}
                <span className="text-green-600">
                  {visibleTenants.filter((t) => t.status === "approved").length}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Pending:{" "}
                <span className="text-amber-600">
                  {visibleTenants.filter((t) => t.status === "pending").length}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Disapproved:{" "}
                <span className="text-red-600">
                  {
                    visibleTenants.filter((t) => t.status === "disapproved")
                      .length
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Profile
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Address
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleTenants.map((tenant) => (
                  <tr key={tenant?.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Image
                        src={
                          tenant?.profilePicture ||
                          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                        }
                        alt="Profile"
                        width={48}
                        height={48}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-gray-200"
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-900 font-medium">
                      {tenant?.firstName} {tenant?.lastName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">
                      {tenant?.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">
                      {tenant?.phoneNumber}
                    </td>
                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-gray-600">
                      {tenant?.address}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          tenant?.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : tenant?.status === "disapproved"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {tenant?.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <button
                        onClick={() => handleTenantClick(tenant)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                        title="View tenant details"
                      >
                        <AiOutlineEye className="mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}