"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useSession";
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import axios from "axios";

export default function ProfilePageAdmin() {
    const { admin, loading, error, signOutAdmin } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = useRouter();
    const [profileData, setProfileData] = useState(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedFile, setSelectedFile] = useState(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [uploading, setUploading] = useState(false);
    const [profilePicture, setProfilePicture] = useState("");
    const [editing, setEditing] = useState(false);
    const [hydrated, setHydrated] = useState(false); //  This is a fix for hydration errors in pages.

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        role: "",
        first_name: "",
        last_name: "",
    });

    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (admin) {
            setProfileData(admin);
            setProfilePicture(admin.profile_picture || "https://via.placeholder.com/150");
            setFormData({
                first_name: admin.first_name || "",
                last_name: admin.last_name || "",
                username: admin.username || "",
                email: admin.email || "",
                role: admin.role || "",

            });
        }
    }, [admin]);

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
            const response = await axios.post("/api/profile/adminProfilePic", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setProfilePicture(response.data.imageUrl);
            setProfileData((prev) => ({ ...prev, profilePicture: response.data.imageUrl }));
            console.log("✅ Image uploaded:", response.data.imageUrl);
        } catch (error) {
            console.error("Upload failed:", error);
        }
        setUploading(false);
    };

    const handleUpdateProfile = async () => {
        try {
            await axios.post("/api/profile/adminProfileUpdate", formData, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            });
            alert("Profile updated successfully!");
            setProfileData((prev) => ({ ...prev, ...formData }));
            setEditing(false);
        } catch (error) {
            console.error("Profile update failed:", error);
            alert("Failed to update profile. Try again.");
        }
    };

    if (loading) return <p>Loading profile...</p>;
    if (!admin) return <p>Admin not found. Please log in.</p>;
    if (error) return <p>Error: {error}</p>;
    if (!hydrated) return null;
    const username = admin.username.toUpperCase();
    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="w-64 bg-white border-r border-gray-200 py-4 px-6">
                <h2 className="text-2xl font-semibold text-blue-600 mb-6">Menu</h2>
                <nav>
                    <ul>
                        <li className="py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
                            <a href="#" className="flex items-center space-x-2 text-gray-700">
                                <UserIcon className="h-5 w-5" />
                                <span>Profile</span>
                            </a>
                        </li>

                        <li className="py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
                            <button onClick={signOutAdmin} className="flex items-center space-x-2 text-gray-700">
                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className="flex-1 p-8">
                <h1 className="text-3xl font-semibold text-blue-600 mb-8">Profile</h1>
                <div className="max-w-2xl mx-auto">
                    <div className="flex flex-col items-center">
                        <div className="flex flex-col items-center relative">
                            <label className="relative cursor-pointer group">
                                {/* Profile Picture */}
                                <img
                                    src={profilePicture}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border border-gray-300 shadow-md"
                                />

                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {/* Change Picture Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0
                        group-hover:bg-opacity-50 rounded-full transition-all duration-300">
            <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100
                           transition-opacity duration-300">
                Change Picture
            </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Welcome, {username}!</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            {editing ? (
                                <input type="text" name="username" value={formData.username} onChange={handleChange}
                                       className="w-full p-2 border rounded-md"/>
                            ) : (
                                <input type="text" value={profileData?.username}
                                       className="text-gray-400 w-full p-2 border rounded-md"/>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            {editing ? (
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                                       className="w-full p-2 border rounded-md"/>
                            ) : (
                                <input type="text" value={profileData?.first_name}
                                       className="text-gray-400 w-full p-2 border rounded-md"/>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            {editing ? (
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                                       className="w-full p-2 border rounded-md"/>
                            ) : (
                                <input type="text" value={profileData?.last_name}
                                       className="text-gray-400 w-full p-2 border rounded-md"/>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email (Read-Only)</label>
                            <input
                                type="text"
                                defaultValue={profileData?.email}
                                className="text-gray-400 w-full p-2 border rounded-md"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Admin Type (Read-Only)</label>
                            <input type="text" value={profileData?.role}
                                   className="text-gray-400 w-full p-2 border rounded-md " readOnly/>
                        </div>
                    </div>

                    <div className="flex justify-between mt-4">
                        <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">Delete Account
                        </button>
                        {editing ? (
                            <button onClick={handleUpdateProfile}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                                Save Changes
                            </button>
                        ) : (
                            <button onClick={() => setEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}