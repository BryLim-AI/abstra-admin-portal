// Add Confirm new Password part. and validation.

'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logEvent } from "../../../../utils/gtag";
import { useRouter } from "next/navigation";
import Footer from "../../../../components/navigation/footer";
import Image from "next/image";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStep = Number(sessionStorage.getItem("forgotPasswordStep"));
      if (storedStep) setStep(storedStep);
      
      const storedEmail = sessionStorage.getItem("forgotPasswordEmail");
      if (storedEmail) setEmail(storedEmail);
  
      const countdownEnd = Number(sessionStorage.getItem("otpCountdownEnd"));
      if (countdownEnd) {
        const remaining = countdownEnd - Date.now();
        if (remaining > 0) setTimer(Math.floor(remaining / 1000));
      }
    }
  }, []);
  

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("forgotPasswordStep", step);
    }
  }, [step]);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("forgotPasswordStep");
        sessionStorage.removeItem("otpCountdownEnd");
      }
    };

    router.prefetch("/pages/auth/login");
    router.events?.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events?.off("routeChangeStart", handleRouteChange);
    };
  }, [router]);

  const handleEmailSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-request", { email });
      toast.success("OTP sent to your email. Enter OTP to proceed.");
      setStep(2);

      sessionStorage.setItem("forgotPasswordEmail", email);

      const countdownEnd = Date.now() + 10 * 60 * 1000;
      sessionStorage.setItem("otpCountdownEnd", countdownEnd);
      setTimer(10 * 60);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send OTP.");
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendLoading || timer > 0) return;

    setResendLoading(true);
    try {
      const response = await axios.post("/api/auth/resend-otp-password", { email });
      toast.success(response.data.message || "New OTP sent to your email.");
      const countdownEnd = Date.now() + 10 * 60 * 1000;
      sessionStorage.setItem("otpCountdownEnd", countdownEnd);
      setTimer(10 * 60);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to resend OTP.");
    }
    setResendLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/verify-otp-reset", { email, otp });
      setResetToken(response.data.resetToken);
      toast.success("OTP verified. Set your new password.");
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      toast.error("Missing reset token.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { resetToken, newPassword }, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Password reset successfully! Redirecting...");
      sessionStorage.clear();
      setTimeout(() => router.push("/pages/auth/login"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Password reset failed.");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="relative flex justify-center items-center min-h-screen bg-gray-100 overflow-hidden">
        <ToastContainer />
        <Image 
          src="/images/hero-section.jpeg" 
          alt="Cityscape view of high-rise buildings" 
          fill
          className="absolute inset-0 object-cover brightness-75"
          priority
        />
        
        <div className="relative z-10 bg-white p-10 rounded-2xl shadow-lg w-full max-w-lg">
          <h2 className="text-3xl font-bold mb-6 text-center">Forgot Password</h2>
  
          {step === 1 && (
            <>
              <p className="text-gray-600 text-sm text-center mb-5">
                Enter your email to receive an OTP.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full p-3 border border-gray-300 rounded-lg text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                onClick={handleEmailSubmit}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all mt-4"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Next"}
              </button>
            </>
          )}
  
          {step === 2 && (
            <>
              <h3 className="text-lg font-semibold mt-6 text-center">Enter OTP</h3>
              <p className="text-gray-600 text-sm text-center mb-5">
                A 6-digit OTP has been sent to your email.
              </p>
  
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full p-3 border border-gray-300 rounded-lg text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength="6"
                required
              />
  
              <button
                onClick={handleVerifyOTP}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all mt-4"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
  
              <p className="text-center text-sm text-gray-500 mt-4">
                {timer > 0
                  ? `Resend available in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`
                  : (<>
                      Didn’t receive an OTP? 
                      <button onClick={handleResendOTP} className="text-blue-600 font-medium hover:underline">Resend OTP</button>
                    </>)}
              </p>
            </>
          )}
  
          {step === 3 && (
            <>
              <h3 className="text-lg font-semibold mt-6 text-center">Set New Password</h3>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full p-3 border border-gray-300 rounded-lg text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
                required
              />
  
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full p-3 border border-gray-300 rounded-lg text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                required
              />
  
              <button
                onClick={handleResetPassword}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all mt-4"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </>
  );
  
}
