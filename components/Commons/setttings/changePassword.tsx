"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

interface Props {
    userId: number | string;
}

const ChangePasswordModal = ({ userId }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
        setIsOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const handleSubmit = async () => {
        if (newPassword !== confirmPassword) {
            Swal.fire("Error", "New passwords do not match", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.put(`/api/user/changePassword`, {
                user_id: userId,
                currentPassword,
                newPassword,
            });
            Swal.fire("Success", "Password updated successfully", "success");
            handleClose();
        } catch (error: any) {
            Swal.fire("Error", error?.response?.data?.message || "Failed to update password", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="mb-6">
                <p className="text-gray-600 mb-2">For your account security, you can update your password below.</p>
            <button
                onClick={handleOpen}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Change Password
            </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-6 relative">
                        <h2 className="text-lg font-semibold mb-4">Change Password</h2>

                        <input
                            type="password"
                            className="w-full border rounded px-3 py-2 mb-3"
                            placeholder="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            className="w-full border rounded px-3 py-2 mb-3"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            className="w-full border rounded px-3 py-2 mb-4"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Updating..." : "Change Password"}
                            </button>
                        </div>

                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChangePasswordModal;
