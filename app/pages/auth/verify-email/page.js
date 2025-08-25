"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TIMER_DURATION = 5 * 60; // 5 minutes

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const storedExpiry = sessionStorage.getItem("otp_timer_expiry");
    if (storedExpiry) {
      const remainingTime = Math.floor(
        (parseInt(storedExpiry) - Date.now()) / 1000
      );
      if (remainingTime > 0) {
        setTimeLeft(remainingTime);
        return;
      }
    }
    resetTimer();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sessionStorage.removeItem("otp_timer_expiry");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const resetTimer = () => {
    setTimeLeft(TIMER_DURATION);
    sessionStorage.setItem(
      "otp_timer_expiry",
      Date.now() + TIMER_DURATION * 1000
    );
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6 || isNaN(otp)) {
      toast.error("OTP must be a 6-digit number");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/auth/verify-otp-reg",
        { otp },
        { withCredentials: true }
      );
      toast.success(response.data.message);
      const userType = response.data.userType;

      setTimeout(() => {
        if (userType === "tenant") {
          window.location.href = "/pages/tenant/my-unit";
        } else if (userType === "landlord") {
          window.location.href = "/pages/landlord/dashboard";
        }
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (timeLeft > 0) return;
    setLoading(true);
    try {
      await axios.post("/api/auth/resend-otp-reg");
      toast.info("New OTP sent. Check your email.");
      resetTimer();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <ToastContainer />
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Verify Your Email
        </h2>
        <p className="text-gray-600 text-sm text-center mb-4">
          Enter the 6-digit OTP sent to your email.
        </p>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="w-full p-2 border rounded-md mb-2 text-center"
          maxLength="6"
          required
        />
        <button
          onClick={handleVerify}
          className="w-full p-2 bg-blue-600 text-white rounded-md"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Didn't receive the OTP?</p>
          <p className="text-sm text-gray-600 mb-2">
            Resend available in: {formatTime(timeLeft)}
          </p>
          <button
            onClick={handleResendOTP}
            className={`text-sm text-white p-2 rounded-md ${
              loading || timeLeft > 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={loading || timeLeft > 0}
          >
            {loading ? "Resending..." : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
