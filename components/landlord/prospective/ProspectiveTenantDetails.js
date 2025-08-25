"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import { EnvelopeIcon, IdentificationIcon } from "@heroicons/react/24/outline";
import {
  BriefcaseIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ProspectiveTenantDetails = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = searchParams.get("unit_id");
  const tenantId = searchParams.get("tenant_id");

  const [tenant, setTenant] = useState(null);
  const [propertyName, setPropertyName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitPhoto, setUnitPhoto] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState("pending");

  useEffect(() => {
    console.log("unitId:", unitId, "tenantId:", tenantId);
    if (unitId && tenantId) {
      fetchTenantDetails();
      fetchUnitDetails();
      fetchApplicationStatus();
    }
  }, [unitId, tenantId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const fetchApplicationStatus = async () => {
    try {
      const response = await axios.get(
        `/api/landlord/prospective/getProspecStatus?unit_id=${unitId}&tenant_id=${tenantId}`
      );
      setApplicationStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching application status:", error);
    }
  };

  const fetchUnitDetails = async () => {
    try {
      const response = await axios.get(
        `/api/landlord/prospective/getUnitInfo?unit_id=${unitId}`
      );

      if (response.data) {
        setUnitName(response.data.unit?.unit_name || "");
        setPropertyName(response.data.property?.property_name || "");
        setUnitPhoto(response.data.photos?.[0] || "");
      }
    } catch (error) {
      console.error("Error fetching unit details:", error);
    }
  };

  const fetchTenantDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `/api/landlord/prospective/interestedTenants?tenant_id=${tenantId}`
      );

      if (response.data) {
        setTenant(response.data);
      }
    } catch (error) {
      console.error("Error fetching tenant details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTenantStatus = async (newStatus) => {
    let disapprovalReason = null;

    if (newStatus === "disapproved") {
      const { value } = await Swal.fire({
        title: "Disapprove Tenant",
        input: "textarea",
        inputLabel: "Provide a reason for disapproval",
        inputPlaceholder: "Type your reason here...",
        inputAttributes: { "aria-label": "Disapproval reason" },
        showCancelButton: true,
      });

      if (!value) return;
      disapprovalReason = value;
    }

    setIsProcessing(true);

    try {
      const payload = {
        unitId,
        tenant_id: tenant?.tenant_id,
        status: newStatus,
        message: newStatus === "disapproved" ? disapprovalReason : null,
      };

      await axios.put("/api/landlord/prospective/updateApplicationStatus", payload);

      setApplicationStatus(newStatus);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Tenant ${newStatus} successfully!`,
        confirmButtonColor: "#3085d6",
      }).then(() => {
        router.back();
      });
    } catch (error) {
      console.error("Error updating tenant status:", error);
      Swal.fire("Error!", "Failed to update tenant status.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 group"
      >
        <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
        <span>Back to Prospective Tenants</span>
      </button>

      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="h-48 bg-gray-200 relative">
            {unitPhoto ? (
              <Image
                src={unitPhoto}
                alt="Unit Photo"
                layout="fill"
                objectFit="cover"
                className="rounded-t-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
                <p className="text-gray-500">No Image Available</p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex flex-col justify-end p-6">
              <h1 className="text-white text-2xl font-bold">
                {propertyName || "Property"}
              </h1>
              <p className="text-white text-lg">Unit {unitName || ""}</p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Tenant Application Review
              </h2>
              <div
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor:
                    applicationStatus === "pending"
                      ? "#FEF3C7"
                      : applicationStatus === "approved"
                      ? "#D1FAE5"
                      : "#FEE2E2",
                  color:
                    applicationStatus === "pending"
                      ? "#92400E"
                      : applicationStatus === "approved"
                      ? "#065F46"
                      : "#B91C1C",
                }}
              >
                {applicationStatus === "pending"
                  ? "Application Pending"
                  : applicationStatus === "approved"
                  ? "Application Approved"
                  : "Application Rejected"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tenant Profile Section */}
              <div className="md:col-span-1 bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center mb-4">
                    {tenant?.profilePicture ? (
                      <Image
                        src={tenant.profilePicture}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-10 w-10 text-gray-500" />
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-center">
                    {tenant?.firstName} {tenant?.lastName}
                  </h3>

                  <div className="flex items-center mt-2 text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <p className="text-sm">
                      DOB: {formatDate(tenant?.birthDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium">{tenant?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <PhoneIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium">
                        {tenant?.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Application Details */}
              <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Applicant Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <BriefcaseIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <p className="font-medium">Occupation</p>
                      </div>
                      <p className="text-gray-700 pl-7">
                        {tenant?.occupation || "Not provided"}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <p className="font-medium">Employment Status</p>
                      </div>
                      <p className="text-gray-700 pl-7">
                        {tenant?.employment_type || "Not provided"}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <p className="font-medium">Monthly Income</p>
                      </div>
                      <p className="text-gray-700 pl-7">
                        {tenant?.monthly_income?.replace("_", "-") ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <p className="font-medium">Current Address</p>
                      </div>
                      <p className="text-gray-700 pl-7">
                        {tenant?.address || "Not provided"}
                      </p>
                    </div>

                    {tenant?.valid_id && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <IdentificationIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <p className="font-medium">Government ID</p>
                        </div>
                        <div className="pl-7">
                          <a
                            href={tenant.valid_id}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            <span>View ID Document</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {tenant?.background_check && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <p className="font-medium">Background Check</p>
                        </div>
                        <div className="pl-7">
                          <a
                            href={tenant.background_check}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            <span>View Background Check</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {tenant?.application_message && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Application Message:
                    </h4>
                    <p className="text-gray-700">
                      {tenant.application_message}
                    </p>
                  </div>
                )}

                {applicationStatus === "pending" && (
                  <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <button
                      onClick={() => updateTenantStatus("approved")}
                      disabled={isProcessing}
                      className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        "Processing..."
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5 mr-2" />
                          Approve Tenant
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => updateTenantStatus("disapproved")}
                      disabled={isProcessing}
                      className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg shadow-sm hover:bg-red-700 transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        "Processing..."
                      ) : (
                        <>
                          <XMarkIcon className="h-5 w-5 mr-2" />
                          Reject Application
                        </>
                      )}
                    </button>
                  </div>
                )}
                {applicationStatus === "approved" && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                        <CheckIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-800">
                          Application Approved
                        </h4>
                        <p className="text-green-700 text-sm">
                          This tenant has been approved for this unit.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {applicationStatus === "disapproved" && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                        <XMarkIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-red-800">
                          Application Rejected
                        </h4>
                        <p className="text-red-700 text-sm">
                          This tenant's application has been rejected.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProspectiveTenantDetails;
