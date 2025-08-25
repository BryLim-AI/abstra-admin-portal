"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Camera,
  Edit3,
  Save,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { logEvent } from "../../utils/gtag";
import DeleteAccountButton from "../authentication/deleteAccountButton";
import useAuthStore from "../../zustand/authStore";
import TenantDetails from "../../components/tenant/profile/profileData";


export default function ProfilePage() {
  const { user, loading, error } = useAuthStore();
  const router = useRouter();
  const user_id = user?.user_id;
  const userType = user?.userType;

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedFile, setSelectedFile] = useState(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [editing, setEditing] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData(user);
      setProfilePicture(
        user.profilePicture || "https://via.placeholder.com/150"
      );
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && user?.userType === "landlord") {
      axios
        .get(`/api/landlord/verification-upload/status?user_id=${user.user_id}`)
        .then((response) => {
          console.log("Verification Status Response:", response.data);
          if (response.data.verification_status) {
            setVerificationStatus(response.data.verification_status);
          } else {
            setVerificationStatus("not verified");
          }
        })
        .catch((err) => {
          console.error("Failed to fetch landlord verification status:", err);
          setVerificationStatus("not verified");
        });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setProfilePicture(URL.createObjectURL(file));

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "/api/profile/uploadProfilePic",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const newImageUrl = response.data.imageUrl;
      setProfilePicture(newImageUrl);
      setProfileData((prev) => ({
        ...prev,
        profilePicture: newImageUrl,
      }));

      useAuthStore.getState().updateUser({
        profilePicture: newImageUrl,
      });

      console.log("Image uploaded:", newImageUrl);
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setUploading(false);
  };

  const handleUpdateProfile = async () => {
    logEvent("Profile Update", "User Interaction", "User Updated Profile", 1);

    try {
      await axios.post("/api/commons/profile/user_profile/update", formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      Swal.fire({
        icon: "success",
        title: "Profile Updated!",
        text: "Your profile has been updated successfully.",
      });

      setProfileData((prev) => ({ ...prev, ...formData }));
      setEditing(false);
    } catch (error) {
      console.error("Profile update failed:", error);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update profile. Please try again.",
      });
    }
  };

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case "verified":
        return (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Verified Landlord
          </div>
        );
      case "pending": // pending
        return (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-4 h-4 mr-1.5" />
            Verification Pending
          </div>
        );
      case "not verified":
        return (
          <div className="space-y-3">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Unverified Account
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Get Verified Today
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Verified landlords get more visibility and build trust with
                    potential tenants.
                  </p>
                  <button
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                    onClick={() => router.push("/pages/landlord/verification")}
                  >
                    Apply for Verification
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200">
            <AlertCircle className="w-4 h-4 mr-1.5" />
            Status Unknown
          </div>
        );
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-blue-600 mb-6">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-6 sm:space-y-0 sm:space-x-6">
              <div className="relative group">
                <label className="cursor-pointer block">
                  <div className="relative">
                    <img
                      src={
                        profilePicture ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                      }
                      alt="Profile"
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-2xl transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                        <Camera className="w-6 h-6 text-white mx-auto mb-1" />
                        <span className="text-white text-xs font-medium">
                          Change Photo
                        </span>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {user?.firstName}
                </h2>
                <p className="text-blue-100 mb-4 capitalize">
                  {user?.userType} Account
                </p>

                {user?.userType === "landlord" && (
                  <div className="flex justify-center sm:justify-start">
                    {getVerificationBadge()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  First Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter your first name"
                  />
                ) : (
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                    {profileData?.firstName}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Last Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter your last name"
                  />
                ) : (
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                    {profileData?.lastName}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (Read-only)
                  </span>
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-medium">
                  {profileData?.email}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                    {profileData?.phoneNumber || "Not provided"}
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Account Type
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (Read-only)
                  </span>
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-medium capitalize">
                  {user?.userType}
                </div>
              </div>
            </div>
            {user?.userType === "tenant" && <TenantDetails userId={user?.user_id} />}
          </div>



          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <DeleteAccountButton user_id={user_id} userType={userType} />

            {editing ? (
              <button
                onClick={() => {
                  logEvent(
                    "Profile Update",
                    "User Interaction",
                    "Clicked Save Changes",
                    1
                  );
                  handleUpdateProfile();
                }}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => {
                  logEvent(
                    "Profile Edit",
                    "User Interaction",
                    "Clicked Edit Profile",
                    1
                  );
                  setEditing(true);
                }}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
