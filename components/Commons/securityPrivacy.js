"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useSession";
import { logEvent } from "../../utils/gtag";
import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import SideNavProfile from "../navigation/sidebar-profile";
import useAuthStore from "../../zustand/authStore";
import ChangePasswordModal from "../Commons/setttings/changePassword";
import TwoFactorToggle from "../Commons/setttings/TwoFactorToggle";

export default function SecurityPage() {
  const { user, loading, error } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    currentPassword: "",  
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handle2FAToggle = async () => {
    const newStatus = !user.is_2fa_enabled;
    logEvent("2FA Enable", "User Interaction", "User Updated 2FA", 1);

    try {
      const res = await fetch("/api/auth/toggle-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          enable_2fa: newStatus,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: data.message,
        });

        setFormData((prev) => ({
          ...prev,
          is_2fa_enabled: newStatus,
        }));

        window.dispatchEvent(new Event("authChange"));
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to update 2FA setting.",
        });
      }
    } catch (error) {
      console.error("Error updating 2FA:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong. Please try again later.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    if (formData.newPassword.length < 8) {
      await Swal.fire({
        icon: "warning",
        title: "Password too short!",
        text: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      await Swal.fire({
        icon: "warning",
        title: "Passwords do not match!",
        text: "Please make sure the new passwords are identical.",
      });
      return;
    }

    try {
      const res = await fetch("/api/profile/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
        credentials: "include"
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Password Updated!",
          text: "Your password has been changed successfully.",
        });
        
    
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } else {
        const data = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: data.message || "Error updating password.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong. Please try again later.",
      });
    }
  };

  if (loading) return <p>Loading security settings...</p>;
  if (!user) return <p>User not found. Please log in.</p>;
  if (error) return <p>Error: {error}</p>;

  return (
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-semibold text-blue-600 mb-8">
          Security & Privacy
        </h1>
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <ChangePasswordModal userId={user?.id} />
          <TwoFactorToggle user_id={user.user_id} />
        </div>
      </div>
  );
}