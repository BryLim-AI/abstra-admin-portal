"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import {
  BuildingOffice2Icon,
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../../../../../../zustand/authStore";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import PropertyDocumentsTab from "../../../../../../components/landlord//properties/PropertyDocumentsTab";
import FBShareButton from "../../../../../../components/landlord/properties/shareToFacebook";

const fetcher = (url) => axios.get(url).then((res) => res.data);

const ViewUnitPage = () => {

  const { id } = useParams();
  const router = useRouter();
  const { fetchSession, user, admin } = useAuthStore();
  const landlord_id = user?.landlord_id;
  const [isNavigating, setIsNavigating] = useState(false);
  const [billingMode, setBillingMode] = useState(false);
  const [billingForm, setBillingForm] = useState({
    billingPeriod: "",
    electricityTotal: "",
    electricityRate: "",
    waterTotal: "",
    waterRate: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billingData, setBillingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasBillingForMonth, setHasBillingForMonth] = useState(false);
  const [unitBillingStatus, setUnitBillingStatus] = useState({});
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("units");

  // Billing Status
  useEffect(() => {
    if (!id) return;
    async function fetchBillingData_PropertyUtility() {
      try {
        const response = await axios.get(
          `/api/landlord/billing/checkPropertyBillingStats`,
          {
            params: { id },
          }
        );

        if (response.data.billingData && response.data.billingData.length > 0) {
          setBillingData(response.data.billingData);
          setHasBillingForMonth(true);
          setBillingForm({
            billingPeriod: response.data.billingData[0]?.billing_period || "",
            electricityTotal:
              response.data.billingData.find(
                (b) => b.utility_type === "electricity"
              )?.total_billed_amount || "",
            electricityRate:
              response.data.billingData.find(
                (b) => b.utility_type === "electricity"
              )?.rate_consumed || "",
            waterTotal:
              response.data.billingData.find((b) => b.utility_type === "water")
                ?.total_billed_amount || "",
            waterRate:
              response.data.billingData.find((b) => b.utility_type === "water")
                ?.rate_consumed || "",
          });
        } else {
          setBillingData(null);
          setHasBillingForMonth(false);
        }
      } catch (error) {
        console.error(
          "Failed to fetch billing data:",
          error.response?.data || error.message
        );
      }
    }
    fetchBillingData_PropertyUtility();
    fetchPropertyDetails();
  }, [id]);

 useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingForm({ ...billingForm, [name]: value });
  };

  const handleSaveOrUpdateBilling = async (e) => {
    e.preventDefault();
    try {
      const url = hasBillingForMonth
        ? "/api/landlord/billing/updateConcessionaireBilling"
        : "/api/landlord/billing/savePropertyUtilityBillingMonthly";

      const response = await axios({
        method: hasBillingForMonth ? "PUT" : "POST",
        url: url,
        data: {
          id,
          ...billingForm,
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: hasBillingForMonth
          ? "Billing information updated successfully."
          : "Billing information saved successfully.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });

      setIsEditing(false);
      setIsModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(
        "Error saving billing:",
        error.response?.data || error.message
      );
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to save billing. Please try again.",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    }
  };

  // get property Overall Details
  const { data: property } = useSWR(
    id ? `/api/propertyListing/viewDetailedProperty/${id}` : null,
    fetcher
  );

  const { data: subscription, isLoading: loadingSubscription } = useSWR(
    `/api/landlord/subscription/active/${landlord_id}`,
    fetcher
  );

const {
  data: units,
  error,
  isLoading,
} = useSWR(id ? `/api/unitListing/getUnitListings?property_id=${id}` : null, fetcher);

//  Get Unit Billing Status
useEffect(() => {
  const fetchUnitBillingStatus = async () => {
    if (!units || units.length === 0) return;

    const statusMap = {};

    await Promise.all(
      units.map(async (unit) => {
        try {
          const response = await axios.get(
            `/api/landlord/billing/getUnitDetails/billingStatus?unit_id=${unit.unit_id}`
          );
          statusMap[unit.unit_id] = response.data?.hasBillForThisMonth || false;
        } catch (error) {
          console.error(`Error fetching billing status for unit ${unit.unit_id}`, error);
        }
      })
    );

    setUnitBillingStatus(statusMap);
  };

  fetchUnitBillingStatus();
}, [units]);

  const handleEditUnit = (unitId) => {
    router.push(
      `/pages/landlord/property-listing/view-unit/${id}/edit-unit/${unitId}`
    );
  };

  const handleAddUnitClick = () => {
    if (!subscription) {
      Swal.fire({
        title: "Subscription Required",
        text: "You need an active subscription to add a unit. Please subscribe to continue.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    if (units.length >= subscription.listingLimits.maxUnits) {
      Swal.fire({
        title: "Unit Limit Reached",
        text: `You have reached the maximum unit limit (${subscription.listingLimits.maxUnits}) for your plan.`,
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    Swal.fire({
      title: "Loading...",
      text: "Redirecting to add unit page...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setTimeout(() => {
      Swal.close();
      router.push(
        `/pages/landlord/property-listing/view-unit/${id}/create-unit?property_id=${id}`
      );
    }, 1500);
  };

  const handleDeleteUnit = async (unitId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.delete(`/api/unitListing/unit?id=${unitId}`);

      if (response.status === 200) {
        Swal.fire("Deleted!", "Unit has been deleted.", "success");
        mutate(`/api/propertyListing/property/${id}`);
        mutate(`/api/unitListing/unit?property_id=${id}`);
      } else {
        Swal.fire(
          "Error",
          "Failed to delete the unit. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting unit:", error);

      let errorMessage = "Failed to delete the unit. Please try again.";

      if (error.response && error.response.data?.error) {
        if (
          error.response.data.error ===
          "Cannot delete unit with active lease agreement"
        ) {
          errorMessage =
            "This unit cannot be deleted because it has an active lease.";
        }
      }

      await Swal.fire("Error", errorMessage, "error");
    }
  };

  async function fetchPropertyDetails() {
    try {
      const response = await axios.get("/api/propertyListing/getPropDetailsById", {
        params: { id },
      });
      setPropertyDetails(response.data.property);
      console.log('property details:', response.data.property);
    } catch (error) {
      console.error("Failed to fetch property details:", error);
    }
  }

  if (error)
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-red-500 text-center">
              Failed to load units. Please try again later.
            </p>
          </div>
        </div>
      </LandlordLayout>
    );

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50 p-6">

        {/* HEADER PART */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border flex flex-col md:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <BuildingOffice2Icon className="h-7 w-7 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {isLoading
                      ? "Loading..."
                      : propertyDetails?.property_name || "Property Details"}
                </h1>
                <p className="text-gray-500 text-lg">Take control of your units efficiently </p>
              </div>
            </div>

            {/* Subscription Usage */}
            {subscription && (
                <div className="mb-4">
                  <p className="text-gray-600 text-sm">
                        <span className="font-semibold">
                          {units?.length}/{subscription.listingLimits.maxUnits}
                        </span>{" "}
                    units used
                  </p>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                    <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{
                          width: `${(units?.length / subscription.listingLimits.maxUnits) * 100}%`,
                        }}
                    />
                  </div>
                </div>
            )}

            {/* Billing Status */}
            {hasBillingForMonth && (
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <FaCheckCircle size={20} />
                  <span className="text-sm">
                          Property Utility Rates is already set for this month.
                  </span>
                </div>
            )}

            {/* Limit Warning */}
            {subscription && units?.length >= subscription.listingLimits.maxUnits && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
                  <ExclamationCircleIcon className="h-6 w-6 text-red-600 mt-0.5" />
                  <p className="text-sm font-medium">
                    You have reached your unit limit.{" "}
                    <span className="font-semibold">Upgrade your plan</span> to add more
                    units.
                  </p>
                </div>
            )}

            {/* FB Share */}
            {propertyDetails && (
                <FBShareButton url={`https://rent-alley-web.vercel.app/pages/find-rent/${propertyDetails?.property_id}`} />
            )}
          </div>

          {/* Sidebar Buttons */}
          <div className="flex flex-col gap-3 w-full md:w-48">
            <button
                className={`flex items-center px-4 py-2 rounded-md font-semibold transition-colors ${
                    loadingSubscription ||
                    !subscription ||
                    units?.length >= subscription?.listingLimits?.maxUnits
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                onClick={handleAddUnitClick}
                disabled={
                    loadingSubscription ||
                    !subscription ||
                    units?.length >= subscription?.listingLimits?.maxUnits
                }
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add Unit
            </button>

            <button
                onClick={() => setBillingMode(!billingMode)}
                className="px-4 py-2 rounded-md font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              {billingMode ? "Exit Billing Mode" : "Enter Billing Mode"}
            </button>

            {/* Billing Actions base on type */}
            <div className="flex flex-col gap-3">
              {billingMode && propertyDetails?.utility_billing_type === "submetered" && (
                  <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 rounded-md font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    Set Utility Rate
                  </button>
              )}
              {/* For non-submetered types, show auto-bill info */}
              {billingMode && propertyDetails?.utility_billing_type !== "submetered" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    Utility bills are only generated for submetered properties. For utilities included in the rent or paid directly to the concessionaire, billing are created automatically.
                  </div>
              )}
            </div>

          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
              onClick={() => setActiveTab("units")}
              className={`pb-2 px-4 font-medium ${
                  activeTab === "units"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
              }`}
          >
           Property Units
          </button>
          <button
              onClick={() => setActiveTab("documents")}
              className={`pb-2 px-4 font-medium ${
                  activeTab === "documents"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Documents / Permits
          </button>
          <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-2 px-4 font-medium ${
                  activeTab === "analytics"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Engagement Analytics
          </button>
        </div>

        {/* Tabbed part of the page section units, and property documents */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
            Available Units
          </h2>

          {/* Unit Tabs */}
          {activeTab === "units" && (
              isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : units && units.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {units.map((unit) => (
                    <div
                      key={unit?.unit_id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {unitBillingStatus[unit.unit_id] && (
                            <div className="text-green-600 flex items-center gap-1 ml-4 mt-2">
                              <FaCheckCircle size={18} />
                              <span className="text-sm">Billed this month</span>
                            </div>
                      )}
                     <button
                            onClick={() =>
                              router.push(
                                `/pages/landlord/property-listing/view-unit/${id}/unit-details/${unit.unit_id}`
                              )
                            }
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                        >
                        View Unit Details
                     </button>

                      <div className="h-32 bg-blue-50 flex items-center justify-center cursor-pointer">
                          <div className="text-center">
                            <HomeIcon className="h-12 w-12 text-blue-600 mx-auto" />
                            <h3 className="text-xl font-bold text-gray-800">
                              Unit {unit?.unit_name}
                            </h3>
                          </div>
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-sm text-gray-600">
                              Size:{" "}
                              <span className="font-medium">
                                {unit?.unit_size} sqm
                              </span>
                            </p>
                                <span
                                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                    unit?.status === "Occupied"
                                      ? "bg-green-100 text-green-800"
                                      : unit?.status === "Unoccupied"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  {unit?.status.charAt(0).toUpperCase() +
                                    unit?.status.slice(1)}
                                </span>
                        </div>

                        <hr className="my-3" />

                        <div className="flex justify-between items-center">

                          <button
                              className="flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/pages/landlord/property-listing/view-unit/tenant-req/${unit.unit_id}`
                                );
                              }}
                            >
                              <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
                              Prospective Leads
                          </button>

                          <div className="flex space-x-2">
                            <button
                              className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUnit(unit.unit_id);
                              }}
                              aria-label="Edit unit"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>

                            <button
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUnit(unit.unit_id);
                              }}
                              aria-label="Delete unit"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>

                          </div>
                        </div>
                      </div>

                      {billingMode && (
                              <div className="mt-5 grid grid-cols-2 gap-3">
                                        <Link
                                          href={`/pages/landlord/billing/billingHistory/${unit.unit_id}`}
                                          className="col-span-2"
                                        >
                                          <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors font-medium">
                                            Billing History
                                          </button>
                                        </Link>

                                        <Link
                                          href={`/pages/landlord/billing/payments/${unit.unit_id}`}
                                          className="col-span-2"
                                        >
                                          <button className="w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors font-medium">
                                            View Payments
                                          </button>
                                        </Link>

                            {unitBillingStatus[unit.unit_id] ? (
                              <Link
                                href={`/pages/landlord/billing/editUnitBill/${unit?.unit_id}`}
                                className="col-span-2"
                              >
                                <button className="w-full bg-amber-50 text-amber-700 px-4 py-2 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors font-medium">
                                  Edit Unit Bill
                                </button>
                              </Link>
                            ) : (
                              <Link
                                href={`/pages/landlord/billing/createUnitBill/${unit?.unit_id}`}
                                className="col-span-2"
                              >
                                <button className="w-full bg-green-50 text-green-700 px-4 py-2 rounded-md border border-green-200 hover:bg-green-100 transition-colors font-medium">
                                  Create Unit Bill
                                </button>
                              </Link>
                            )}
                      </div>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <HomeIcon className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    No Units Available
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    Add your first unit to get started
                  </p>
                  <button
                    className="px-4 py-2 text-sm text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                    onClick={handleAddUnitClick}
                  >
                    Add Your First Unit
                  </button>
                </div>
              )
              )}
        </div>

        {activeTab === "documents" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <PropertyDocumentsTab propertyId={id} />
            </div>
        )}

        {activeTab === "analytics" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Engagement Analytics
              </h2>

              <p className="text-gray-600 mb-4">
                Below are engagement insights for this property (views, clicks, shares).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-700">Page Views</h3>
                  <p className="text-2xl font-bold text-blue-900 mt-2">1,240</p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-700">Inquiries</h3>
                  <p className="text-2xl font-bold text-green-900 mt-2">56</p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-700">Shares</h3>
                  <p className="text-2xl font-bold text-purple-900 mt-2">19</p>
                </div>
              </div>
            </div>
        )}

        {/*modal for property utility rate for sub-metered */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Property Utility
                </h2>
              </div>
              
              <div className="p-5">
                {billingData ? (
                  <div className="mb-6 p-4 bg-green-50 rounded-md border border-green-200">
                    <h3 className="font-medium text-green-700 mb-2">Billing set for this month</h3>
                    <p className="text-gray-700 mb-3">Period: <span className="font-medium">{billingForm?.billingPeriod}</span></p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="p-3 bg-white rounded-md border border-gray-200">
                        <h4 className="text-sm uppercase text-gray-500 font-semibold mb-2">Electricity</h4>
                        <p className="text-gray-800 font-medium">₱{billingData.find(b => b.utility_type === "electricity")?.total_billed_amount || "N/A"}</p>
                        <p className="text-xs text-gray-500 mt-1">{billingData.find(b => b.utility_type === "electricity")?.rate_consumed || "N/A"} kWh</p>
                      </div>
                      
                      <div className="p-3 bg-white rounded-md border border-gray-200">
                        <h4 className="text-sm uppercase text-gray-500 font-semibold mb-2">Water</h4>
                        <p className="text-gray-800 font-medium">₱{billingData.find(b => b.utility_type === "water")?.total_billed_amount || "N/A"}</p>
                        <p className="text-xs text-gray-500 mt-1">{billingData.find(b => b.utility_type === "water")?.rate_consumed || "N/A"} cu. meters</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-gray-600 text-center">
                      No billing data found for this month
                    </p>
                  </div>
                )}
                
                <form className="space-y-5" onSubmit={handleSaveOrUpdateBilling}>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Billing Period
                    </label>
                    <input
                      name="billingPeriod"
                      value={billingForm.billingPeriod}
                      onChange={handleInputChange}
                      type="date"
                      className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                    <h3 className="text-md font-semibold text-blue-800 mb-3">
                      Electricity
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Total Amount Billed
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                          <input
                            type="number"
                            name="electricityTotal"
                            value={billingForm.electricityTotal}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md p-2.5 pl-7 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Rate this month (kWh)
                        </label>
                        <input
                          type="number"
                          name="electricityRate"
                          value={billingForm.electricityRate}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-cyan-50 rounded-md border border-cyan-100">
                    <h3 className="text-md font-semibold text-cyan-800 mb-3">
                      Water
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Total Amount Billed
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                          <input
                            type="number"
                            name="waterTotal"
                            value={billingForm.waterTotal}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md p-2.5 pl-7 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Rate this month (cu. meters)
                        </label>
                        <input
                          type="number"
                          name="waterRate"
                          value={billingForm.waterRate}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrUpdateBilling}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {isEditing ? "Update Utility Info" : "Save Utility Info"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </LandlordLayout>
  );
};

export default ViewUnitPage;
