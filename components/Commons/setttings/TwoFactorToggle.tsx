"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface TwoFactorToggleProps {
  user_id: string;
  initialIs2FAEnabled?: boolean;
}

const TwoFactorToggle = ({
  user_id,
  initialIs2FAEnabled,
}: TwoFactorToggleProps) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(
    initialIs2FAEnabled || false
  );
  const [loading, setLoading] = useState(true);

  const fetch2FAStatus = async () => {
    try {
      const res = await fetch(`/api/auth/get2faStatus?user_id=${user_id}`);
      const data = await res.json();
      setIs2FAEnabled(data.is2FAEnabled);
    } catch (err) {
      console.error("Error fetching 2FA status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialIs2FAEnabled !== undefined) {
      setIs2FAEnabled(initialIs2FAEnabled);
      setLoading(false);
    } else {
      fetch2FAStatus();
    }
  }, [user_id, initialIs2FAEnabled]);

  const handleToggle2FA = async () => {
    const newStatus = !is2FAEnabled;

    if (newStatus) {
      // Enabling 2FA
      const result = await Swal.fire({
        title: "Enable Email 2FA?",
        html: `
                    <div class="text-left">
                        <p class="mb-3">When enabled, you'll receive verification codes via email during login.</p>
                        <div class="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                            <h4 class="font-semibold text-blue-800 mb-2">📧 Email-Based Authentication</h4>
                            <ul class="text-sm text-blue-700 space-y-1">
                                <li>• Codes sent to your registered email</li>
                                <li>• Each code is valid for a limited time</li>
                                <li>• Provides an extra layer of security</li>
                            </ul>
                        </div>
                    </div>
                `,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Enable Email 2FA",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;
    } else {
      // Disabling 2FA
      const result = await Swal.fire({
        title: "Disable 2FA?",
        text: "This will make your account less secure. You won't receive email verification codes during login.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, disable it",
        cancelButtonText: "Keep it enabled",
      });

      if (!result.isConfirmed) return;
    }

    try {
      const res = await fetch("/api/auth/toggle2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, enable_2fa: newStatus }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setIs2FAEnabled(newStatus);

        Swal.fire({
          icon: "success",
          title: newStatus ? "2FA Enabled!" : "2FA Disabled",
          html: newStatus
            ? `
                            <div class="text-center">
                                <p class="mb-3">Email-based two-factor authentication is now active!</p>
                                <div class="bg-green-50 p-3 rounded">
                                    <p class="text-sm text-green-700">
                                        <strong>Next login:</strong> You'll receive a verification code via email
                                    </p>
                                </div>
                            </div>
                        `
            : "Two-factor authentication has been disabled.",
        });

        window.dispatchEvent(new Event("authChange"));
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: data.message || "Failed to update 2FA setting.",
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

  if (loading)
    return <p className="text-sm text-gray-500">Loading 2FA status...</p>;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">
          Email Two-Factor Authentication
        </h2>
        {is2FAEnabled && (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Active
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Secure your account by receiving verification codes via email during
        login.
      </p>

      {!is2FAEnabled ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 mt-1">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">
                  📧 Email-Based Verification
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                  When you enable 2FA, you'll receive 6-digit verification codes
                  via email during login.
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 🔒 Extra security for your account</li>
                  <li>• 📱 No app installation required</li>
                  <li>• ⚡ Codes delivered instantly to your email</li>
                  <li>• ⏰ Each code expires after a few minutes</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleToggle2FA}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Enable Email 2FA
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-green-500 mt-1">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-green-800 mb-2">
                  ✅ Email 2FA is Active
                </h3>
                <p className="text-sm text-green-700">
                  Your account is protected with email-based two-factor
                  authentication. During login, verification codes will be sent
                  to your registered email address.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">💡</span>
              <p className="text-sm text-amber-700">
                <strong>How it works:</strong> When logging in, check your email
                for the 6-digit verification code and enter it to complete
                authentication.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle2FA}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Disable Email 2FA
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorToggle;
