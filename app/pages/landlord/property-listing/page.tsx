"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import usePropertyStore from "../../../../zustand/property/usePropertyStore";
import Image from "next/image";
import axios from "axios";
import Swal from "sweetalert2";
import {
    BuildingOffice2Icon,
    HomeIcon,
    PlusCircleIcon,
    PencilSquareIcon,
    TrashIcon,
    MapPinIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import useAuthStore from "../../../../zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import PropertyCard from "@/components/landlord/properties/propertyCards";
import FBShareButton from "@/components/landlord/properties/shareToFacebook";

const PropertyListingPage = () => {
    const router = useRouter();
    const {fetchSession, user, admin} = useAuthStore();
    const {properties, fetchAllProperties, loading, error} = usePropertyStore();
    const [verificationStatus, setVerificationStatus] = useState<string>("not verified");
    const [isFetchingVerification, setIsFetchingVerification] = useState(true);
    const [fetchingSubscription, setFetchingSubscription] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [pendingApproval, setPendingApproval] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");


    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin]);

    useEffect(() => {
        if (user?.landlord_id) {
            fetchAllProperties(user?.landlord_id);
        }
    }, [user?.landlord_id, fetchAllProperties]);

    useEffect(() => {
        if (properties.length > 0) {
            const hasUnverifiedProperties = properties.some(
                (property) =>
                    property?.verification_status?.toLowerCase() !== "verified"
            );
            setPendingApproval(hasUnverifiedProperties);
        }
    }, [properties]);

    // Fetch verification + subscription status
    useEffect(() => {
        if (user?.userType !== "landlord") return;

        setVerificationStatus(null);
        setIsFetchingVerification(true);

        const fetchVerificationAndSubscription = async () => {
            try {
                // Fetch verification status
                const verificationRes = await axios.get(
                    `/api/landlord/verification-upload/status?user_id=${user?.user_id}`
                );
                const status = verificationRes.data.verification_status || "not verified";
                console.log('status of landlord: ', status);
                setVerificationStatus(status.toLowerCase());
            } catch (err) {
                console.error("[ERROR] Failed to fetch landlord verification:", err);
                setVerificationStatus("not verified");
            } finally {
                setIsFetchingVerification(false);
            }

            try {
                // Fetch subscription
                setFetchingSubscription(true);
                const subscriptionRes = await axios.get(
                    `/api/landlord/subscription/active/${user?.landlord_id}`
                );
                setSubscription(subscriptionRes.data);
            } catch (err) {
                console.error("[ERROR] Failed to fetch subscription:", err);
            } finally {
                setFetchingSubscription(false);
            }
        };

        fetchVerificationAndSubscription();
    }, [user]);


    // @ts-ignore
    const handleEdit = (propertyId, event) => {
        event.stopPropagation();
        router.push(`../landlord/property-listing/edit-property/${propertyId}`);
    };

    // @ts-ignore
    const handleView = useCallback((property, event) => {
        event.stopPropagation();
        router.push(
            `/pages/landlord/property-listing/view-unit/${property.property_id}`
        );
    });
    // @ts-ignore
    const handleAddProperty = () => {
        // 1. Verification check
        if (verificationStatus !== "approved") {
            Swal.fire(
                "Verification Required",
                "Your account must be verified before adding a property.",
                "warning"
            );
            return;
        }

        // 2. Subscription check
        if (!subscription) {
            Swal.fire(
                "No Subscription",
                "You need an active subscription to add properties.",
                "info"
            );
            return;
        }

        if (subscription?.is_active !== 1) {
            Swal.fire(
                "Inactive Subscription",
                "Your subscription is not active. Please renew or upgrade.",
                "error"
            );
            return;
        }

        // 3. Property limit check
        if (
            properties.length >= (subscription?.listingLimits?.maxProperties || 0)
        ) {
            Swal.fire(
                "Limit Reached",
                "You’ve reached the maximum number of properties allowed in your current plan.",
                "error"
            );
            return;
        }

        // 4. Pending approval check (optional — block or just warn)
        if (pendingApproval) {
            Swal.fire(
                "Pending Approval",
                "Some of your properties are still pending approval. You may add another, but approval may take longer.",
                "info"
            );
            // Depending on your rule, you can either `return;` here or allow navigation
            // return;
        }

        // ✅ All checks passed → navigate
        setIsNavigating(true);
        router.push(`/pages/landlord/property-listing/create-property`);
    };

    // @ts-ignore
    const handleDelete = useCallback(
        async (propertyId, event) => {
            event.stopPropagation();
            const result = await Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to recover this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, delete it!",
            });
            if (!result.isConfirmed) return;

            try {
                const response = await fetch(
                    `/api/propertyListing/deletePropertyListing/${propertyId}`,
                    {method: "DELETE"}
                );
                const data = await response.json();

                if (response.ok) {
                    Swal.fire("Deleted!", "Property deleted successfully.", "success").then(
                        () => {
                            fetchAllProperties(user?.landlord_id);
                        }
                    );
                } else {
                    let errorMessage = "Failed to delete property.";
                    if (data?.error === "Cannot delete property with active leases") {
                        errorMessage =
                            "This property cannot be deleted because it has active leases.";
                    }
                    Swal.fire("Error!", errorMessage, "error");
                }
            } catch (error) {
                console.error("Error deleting property:", error);
                Swal.fire("Error!", "An error occurred while deleting.", "error");
            }
        },
        [user?.landlord_id, fetchAllProperties]
    );

    if (!user?.landlord_id) {
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
        return <LoadingScreen message='Just a moment, getting things ready...' />;
        </div>
    }

    if (loading) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
            <LoadingScreen message = 'Fetching your properties, please wait...'/>
        </div>
    );

    if (error) return <p className="text-center mt-4 text-red-500">{error}</p>;

    // @ts-ignore
    const isAddDisabled =
        isFetchingVerification ||
        fetchingSubscription ||
        verificationStatus !== "approved" || // ✅ Only approved allows adding
        !subscription ||
        subscription?.is_active !== 1 ||
        properties.length >= (subscription?.listingLimits?.maxProperties || 0) ||
        isNavigating;

    const filteredProperties = properties.filter((property) => {
        const query = searchQuery.toLowerCase();
        return (
            property?.property_name?.toLowerCase().includes(query) ||
            property?.address?.toLowerCase().includes(query) ||
            property?.property_id?.toString().includes(query)
        );
    });

    return (
        <LandlordLayout>
            <div className="min-h-screen bg-gray-50 p-6">

                {!isFetchingVerification && (
                    <div className="mb-6">
                        {/* 1. ❌ No verification + no subscription */}
                        {!verificationStatus && !subscription ? (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <div className="flex items-center">
                                    <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                                    <div>
                                        <p className="font-bold text-red-700">Account Setup Required</p>
                                        <p className="text-sm text-red-600">
                                            You must verify your landlord account and choose a subscription plan before listing properties.
                                        </p>
                                        <div className="mt-2 flex space-x-4">
                                            <Link
                                                href="/pages/landlord/verification"
                                                className="text-blue-600 underline text-sm"
                                            >
                                                Verify Account
                                            </Link>
                                            <Link
                                                href="/pages/landlord/sub_two/subscription"
                                                className="text-blue-600 underline text-sm"
                                            >
                                                Choose a Plan
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        ) : verificationStatus === "pending" && !subscription ? (
                            /* 2. ⏳ Pending + no subscription */
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
                                <div className="flex items-center">
                                    <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mr-3" />
                                    <div>
                                        <p className="font-bold text-yellow-700">Verification Pending</p>
                                        <p className="text-sm text-yellow-600">
                                            Your account verification is under review. You can select a subscription plan now, but you’ll only be able to list properties once verified.
                                        </p>
                                        <Link
                                            href="/pages/landlord/sub_two/subscription"
                                            className="inline-block mt-2 text-blue-600 underline text-sm"
                                        >
                                            Choose a Plan
                                        </Link>
                                    </div>
                                </div>
                            </div>

                        ) : verificationStatus === "pending" ? (
                            /* 2b. ⏳ Pending only (subscription exists) */
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
                                <div className="flex items-center">
                                    <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mr-3" />
                                    <div>
                                        <p className="font-bold text-yellow-700">Verification Pending</p>
                                        <p className="text-sm text-yellow-600">
                                            Your landlord verification is under review. You’ll be able to list properties once approved.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        ) : verificationStatus === "rejected" ? (
                            /* ❌ Rejected */
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <div className="flex items-center">
                                    <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                                    <div>
                                        <p className="font-bold text-red-700">Verification Rejected</p>
                                        <p className="text-sm text-red-600">
                                            Your landlord verification was rejected. Please resubmit your documents.
                                        </p>
                                        <Link
                                            href="/pages/landlord/verification"
                                            className="inline-block mt-2 text-blue-600 underline text-sm"
                                        >
                                            Resubmit Verification
                                        </Link>
                                    </div>
                                </div>
                            </div>

                        ) : verificationStatus !== "approved" ? (
                            /* 3. Other statuses → Verification Required */
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <div className="flex items-center">
                                    <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                                    <div>
                                        <p className="font-bold text-red-700">Verification Required</p>
                                        <p className="text-sm text-red-600">
                                            Verify your landlord account before adding properties.
                                        </p>
                                        <Link
                                            href="/pages/landlord/verification"
                                            className="inline-block mt-2 text-blue-600 underline text-sm"
                                        >
                                            Verify Account
                                        </Link>
                                    </div>
                                </div>
                            </div>

                        ) : !subscription || subscription?.is_active !== 1 ? (
                            /* 🟡 Approved but no/ inactive subscription */
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
                                <div className="flex items-center">
                                    <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mr-3" />
                                    <div>
                                        <p className="font-bold text-yellow-700">Subscription Required</p>
                                        <p className="text-sm text-yellow-600">
                                            You need an active subscription to list properties.
                                        </p>
                                        <Link
                                            href="/pages/landlord/sub_two/subscription"
                                            className="inline-block mt-2 text-blue-600 underline text-sm"
                                        >
                                            Choose a Plan
                                        </Link>
                                    </div>
                                </div>
                            </div>

                        ) : properties.length >= (subscription?.listingLimits?.maxProperties || 0) ? (
                            /* 🟡 Property limit reached */
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
                                <div className="flex items-center">
                                    <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mr-3" />
                                    <div>
                                        <p className="font-bold text-yellow-700">Property Limit Reached</p>
                                        <p className="text-sm text-yellow-600">
                                            You’ve reached the maximum allowed properties (
                                            {subscription?.listingLimits?.maxProperties ?? 0}). Upgrade your plan to add more.
                                        </p>
                                        <Link
                                            href="/pages/landlord/sub_two/subscription"
                                            className="inline-block mt-2 text-blue-600 underline text-sm"
                                        >
                                            Upgrade Plan
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Property Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
                            <h1 className="text-2xl font-bold text-blue-600">Property Listings</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {subscription && (
                                <div className="hidden md:flex flex-col items-end w-48">
                                    <div className="flex justify-between w-full text-sm text-gray-600 mb-1">
                                        <span>Properties Used</span>
                                        <span className="font-medium">
              {properties.length}/{subscription?.listingLimits?.maxProperties}
            </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full h-2 bg-gray-200 rounded-full">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                properties.length >= subscription?.listingLimits?.maxProperties
                                                    ? "bg-red-500"
                                                    : "bg-blue-600"
                                            }`}
                                            style={{
                                                width: `${
                                                    (properties.length /
                                                        subscription?.listingLimits?.maxProperties) *
                                                    100
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <button
                                className={`flex items-center px-4 py-2 rounded-md font-bold transition-colors ${
                                    isAddDisabled
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                                onClick={handleAddProperty}
                                disabled={isAddDisabled}
                            >
                                {isFetchingVerification || fetchingSubscription || isNavigating ? (
                                    <span className="flex items-center">
            <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0
                   5.373 0 12h4zm2 5.291A7.962
                   7.962 0 014 12H0c0 3.042 1.135
                   5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
                                        {isNavigating ? "Redirecting..." : "Checking..."}
          </span>
                                ) : (
                                    <>
                                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                                        Add New Property
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <p className="text-gray-600">Manage your property listings and units</p>
                </div>

                {pendingApproval && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                        <strong>Pending Approval:</strong> Some properties are under review.
                        You can add units, though your property will not be visible to the public.
                    </div>
                )}

                <div className="mb-6 flex justify-center">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your property by name"
                        className="w-full md:w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                    {filteredProperties.length > 0 ? (
                        filteredProperties.map((property, index) => (
                            <PropertyCard
                                key={property.property_id}
                                property={property}
                                index={index}
                                subscription={subscription}
                                handleView={handleView}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500">
                            No matching properties found.
                        </p>
                    )}
                </div>



            </div>
        </LandlordLayout>
);
}

export default PropertyListingPage;

