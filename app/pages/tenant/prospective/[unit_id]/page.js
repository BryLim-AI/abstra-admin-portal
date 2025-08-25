"use client";
import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiUploadCloud } from "react-icons/fi";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import Swal from "sweetalert2";
import { FiArrowLeft } from "react-icons/fi";
import occupations from "../../../../../constant/occupations";
import employmentTypes from "../../../../../constant/employementType";
import monthlyIncomeRanges from "../../../../../constant/monthlyIncome";

const TenantApplicationForm = () => {
  const { unit_id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    unit_id: "",
    occupation: "",
    employment_type: "",
    monthly_income: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  //  Check if application is submitted for a particular unit. (same unit)
  useEffect(() => {
    if (!user || !unit_id) return;

    const checkTenantApplication = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/applications/alreadyApplied`,
          {
            params: {
              tenant_id: user?.tenant_id,
              unit_id,
            },
          }
        );

        if (response.data.hasApplied) {
          setHasApplied(true);
        }
      } catch (error) {
        console.error("Error checking tenant application:", error);
      } finally {
        setLoading(false);
      }
    };

    checkTenantApplication();
  }, [user, unit_id]);

  useEffect(() => {
    if (unit_id) {
      setFormData((prev) => ({
        ...prev,
        unit_id: unit_id || "",
      }));
    }
  }, [unit_id]);

  if (!user || loading) {
    return <div>Loading...</div>;
  }

  if (hasApplied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          You have already applied for this property.
        </h2>

        <div className="mt-6 flex space-x-4">
          <button
            className="px-5 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition"
            onClick={() => router.push("/pages/tenant/my-unit")}
          >
            View My Units
          </button>
          <button
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition"
            onClick={() => router.push("/pages/find-rent")}
          >
            Find Another Rental
          </button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {

      if (file.size > 15 * 1024 * 1024) {
        Swal.fire("Error", "File size exceeds 15MB!", "error");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDropboxClick = () => {
    fileInputRef.current.click();
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!user.tenant_id) {
      return Swal.fire("Error", "Please log in.", "error");
    }

    if (!selectedFile) {
      return Swal.fire("Error", "Please upload a valid ID.", "error");
    }

    if (
      !formData.address ||
      !formData.occupation ||
      !formData.employment_type ||
      !formData.monthly_income
    ) {
      return Swal.fire("Error", "All fields are required.", "error");
    }

    const confirmSubmission = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to proceed with the submission?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, submit it!",
      cancelButtonText: "No, cancel",
    });

    if (!confirmSubmission.isConfirmed) return;

    setIsSubmitting(true);

    Swal.fire({
      title: "Submitting...",
      text: "Please wait while we process your submission.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const infoPayload = {
        unit_id: formData.unit_id,
        tenant_id: user.tenant_id,
        address: formData.address,
        occupation: formData.occupation,
        employment_type: formData.employment_type,
        monthly_income: formData.monthly_income,
      };

      const infoResponse = await axios.put(
        "/api/tenant/applications/submitApplication",
        infoPayload
      );

      if (infoResponse.status === 200) {
        if (selectedFile) {
          const fileFormData = new FormData();
          fileFormData.append("file", selectedFile);
          fileFormData.append("unit_id", formData.unit_id);
          fileFormData.append("tenant_id", user.tenant_id);

          try {
            const reqResponse = await axios.post(
              "/api/tenant/applications/submitDocRequirements",
              fileFormData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              }
            );

            if (reqResponse.status !== 201) {
              new Error(
                reqResponse.data.message || "Failed to submit requirements."
              );
            }
          } catch (reqError) {
            await Swal.fire(
              "Error",
              `Submission failed: ${reqError.message || "Network error"}`,
              "error"
            );
            setIsSubmitting(false);
            return;
          }
        }

        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Submission successful!",
        });

        router.push("/pages/tenant/prospective/success");
      } else {
        throw new Error(
          infoResponse.data?.message || "Failed to save tenant info."
        );
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: `Submission failed: ${error.message || "Network error"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/pages/find-rent");
  };

  return (
    <div className="relative bg-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
          Tenant Application Form
        </h1>

        <div className="mb-6">

          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 flex items-center text-gray-700 hover:text-gray-900"
          >
            <FiArrowLeft className="w-6 h-6 mr-2" />
            <span className="text-sm font-semibold">Back</span>
          </button>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Steps to follow:
          </h2>
          <ol className="list-decimal list-inside text-gray-500">
            <li>Submit your valid I.D. to the dropbox below</li>
          </ol>
        </div>


        <div className="mb-6">
          <h3 className="text-sm text-gray-500 mb-1">Dropbox Below:</h3>
          <p className="text-xs text-gray-500 mb-2">
            Submit all requirements below. Thank you!
          </p>

          <div
            className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer"
            onClick={handleDropboxClick}
          >
            <FiUploadCloud className="w-12 h-12 text-gray-400 mb-2" />

            <p className="text-sm text-gray-700 font-medium">
              Drag & drop files or <span className="text-blue-500">Browse</span>
            </p>
            <p className="text-xs text-gray-500">Max File Size: 15MB</p>


            <input
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />

            {selectedFile && (
              <p className="mt-2 text-sm text-gray-500">
                Selected file: {selectedFile.name}
              </p>
            )}
          </div>
        </div>


        <form onSubmit={handleFormSubmit}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              2. Kindly fill up the application form.
            </h2>


            <div className="mb-4">
              <label
                htmlFor="firstName"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                value={user.firstName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                disabled
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="lastName"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                value={user.lastName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                disabled
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="birthDate"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Date Of Birth (MM/DD/YYYY)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={user.birthDate ? user.birthDate.substring(5, 7) : ""}
                  className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                  disabled
                />
                <input
                  type="text"
                  value={user.birthDate ? user.birthDate.substring(8, 10) : ""}
                  className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                  disabled
                />
                <input
                  type="text"
                  value={user.birthDate ? user.birthDate.substring(0, 4) : ""}
                  className="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                  disabled
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                value={user.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="mobile"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Mobile Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                value={user.phoneNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                disabled
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="occupation"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Your Occupation
              </label>
              <select
                id="occupation"
                className="w-full border border-gray-300 bg-white text-gray-700 rounded py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.occupation || ""}
                onChange={(e) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Occupation
                </option>
                {occupations.map((occupation) => (
                  <option key={occupation.value} value={occupation.value}>
                    {occupation.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="employment_type"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Employment Type
              </label>
              <select
                id="employment_type"
                className="w-full border border-gray-300 bg-white text-gray-700 rounded py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.employment_type || ""}
                onChange={(e) =>
                  setFormData({ ...formData, employment_type: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Employment Type
                </option>
                {employmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="monthly_income"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Monthly Income Range
              </label>
              <select
                id="monthly_income"
                className="w-full border border-gray-300 bg-white text-gray-700 rounded py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.monthly_income || ""}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_income: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Monthly Income
                </option>
                {monthlyIncomeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="address"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-transparent hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 border border-gray-500 hover:border-transparent rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantApplicationForm;
