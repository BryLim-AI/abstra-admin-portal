"use client";
import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "../../../../zustand/authStore";
import { logEvent } from "../../../../utils/gtag";
import Footer from "../../../../components/navigation/footer";
import Image from "next/image";
import ReCAPTCHA from "react-google-recaptcha";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function LoginPage() {
  return (
      <Suspense fallback={<div>Loading...</div>}>
        <Login />
      </Suspense>
  );
}

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();
  const { user, admin, fetchSession } = useAuthStore();
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const redirectBasedOnUserType = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        switch (data.userType) {
          case "tenant":
            return router.replace("/pages/tenant/my-unit");
          case "landlord":
            return router.replace("/pages/landlord/dashboard");
          case "admin":
            return router.replace("/pages/admin/dashboard");
          default:
            return router.replace("/pages/auth/login");
        }
      }
    } catch (error) {
      console.error("Redirection failed:", error);
    }
  };

  useEffect(() => {
    sessionStorage.removeItem("pending2FA");
    window.history.replaceState(null, "", "/pages/auth/login");
    if (user || admin) {
      redirectBasedOnUserType();
    }
  }, [user, admin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    try {
      loginSchema.pick({ [id]: true }).parse({ [id]: value });
      setErrors((prevErrors) => ({ ...prevErrors, [id]: "" }));
    } catch (error: any) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: error.errors[0]?.message || "",
      }));
    }
  };

  const handleGoogleSignin = async () => {
    setIsLoggingIn(true);
    setErrorMessage("");
    try {
      logEvent("Login Attempt", "Google Sign-In", "User Clicked Google Login", 1);
      router.push("/api/auth/google-login");
    } catch (err: any) {
      console.error("Google Sign-In Error:", err.message);
      setErrorMessage("Google sign-in failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setErrorMessage("Please verify you're not a robot.");
      return;
    }

    logEvent("Login Attempt", "User Interaction", "User Submitted Login Form", 1);

    try {
      loginSchema.parse(formData);
      setIsLoggingIn(true);
      setErrorMessage("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, captchaToken, rememberMe }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        logEvent("Login Success", "Authentication", "User Successfully Logged In", 1);
        if (data.requires_otp) {
          router.push(`/pages/auth/verify-2fa?user_id=${data.user_id}`);
        } else {
          await fetchSession();
          await redirectBasedOnUserType();
        }
      } else {
        logEvent("Login Failed", "Authentication", "User Entered Incorrect Credentials", 1);
        setErrorMessage(data.error || "Invalid credentials");

        if (window.grecaptcha) window.grecaptcha.reset();
        setCaptchaToken("");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      if (window.grecaptcha) window.grecaptcha.reset();
      setCaptchaToken("");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
      <>
        <div className="min-h-screen flex flex-col lg:flex-row">
          {/* Left Image (Large screens only) */}
          <div className="hidden lg:flex flex-1 relative">
            <Image
                src="/images/hero-section.jpeg"
                alt="Cityscape view of high-rise buildings"
                fill
                className="object-cover brightness-75"
                priority
            />
          </div>

          {/* Form Container */}
          <div className="flex-1 flex justify-center items-center relative bg-gray-100 lg:bg-white">
            {/* Mobile background hero image */}
            <div className="absolute inset-0 lg:hidden">
              <Image
                  src="/images/hero-section.jpeg"
                  alt="Cityscape view of high-rise buildings"
                  fill
                  className="object-cover brightness-75"
                  priority
              />
            </div>

            {/* Form Box */}
            <div className="relative z-10 w-full max-w-md sm:max-w-lg mx-4 sm:mx-auto p-6 sm:p-10 bg-white rounded-2xl shadow-lg">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <Image
                    src="/Hestia-logo-b.svg"
                    alt="Hestia Logo"
                    width={80}
                    height={60}
                    className="object-contain"
                />
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                      type="email"
                      id="email"
                      className="mt-1 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="juan@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                      type="password"
                      id="password"
                      className="mt-1 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {errorMessage && <p className="text-red-600 text-sm text-center">{errorMessage}</p>}

                <p className="text-center text-sm">
                  <Link
                      href="./forgot-password"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </p>

                {/* reCAPTCHA */}
                <div className="flex justify-center mt-4">
                  <ReCAPTCHA
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "your-site-key"}
                      onChange={(token) => setCaptchaToken(token)}
                  />
                </div>

                {/* Login Button */}
                <button
                    type="submit"
                    disabled={isLoggingIn}
                    className={`w-full py-3 px-4 flex items-center justify-center font-semibold rounded-lg transition-all ${
                        isLoggingIn
                            ? "bg-blue-400 text-white cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  {isLoggingIn ? (
                      <div className="flex items-center space-x-2">
                        <svg
                            className="animate-spin h-5 w-5 text-white"
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
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          ></path>
                        </svg>
                        <span>Logging in...</span>
                      </div>
                  ) : (
                      "Login"
                  )}
                </button>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="mr-2"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-700">
                    Remember Me
                  </label>
                </div>

                <p className="text-center text-sm mt-3">
                  <Link
                      href="/pages/admin_login"
                      className="text-teal-600 hover:text-teal-800 hover:underline font-medium"
                  >
                    System Admin Login
                  </Link>
                </p>
              </form>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="border-t border-gray-300 flex-grow"></div>
                <span className="mx-3 text-gray-500 font-medium">or</span>
                <div className="border-t border-gray-300 flex-grow"></div>
              </div>

              {/* Google Login */}
              <button
                  type="button"
                  onClick={handleGoogleSignin}
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center bg-white shadow-md hover:bg-gray-50 transition-all"
              >
                <GoogleLogo className="mr-2" />
                <span className="font-medium text-gray-700">Login with Google</span>
              </button>

              <p className="mt-6 text-center text-sm text-gray-500">
                Don&#39;t have an account?
                <Link
                    href="../auth/selectRole"
                    className="text-blue-600 hover:underline font-medium ml-1"
                >
                  Create Now
                </Link>
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </>
  );
}
