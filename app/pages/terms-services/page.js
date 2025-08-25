"use client";
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function TermsAndConditions() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-16">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-6">
          Terms and Conditions
        </h1>
        <p className="text-lg text-gray-600 text-center mb-10">
          Last Updated: March 2025
        </p>

        {/* Terms Sections */}
        <div className="space-y-8">
          {/* 1. Introduction */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              1. Introduction
            </h2>
            <p className="mt-2 text-gray-600">
              Welcome to our platform. By accessing or using our services, you
              agree to be bound by these terms. Please read them carefully.
            </p>
          </div>

          {/* 2. User Responsibilities */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              2. User Responsibilities
            </h2>
            <p className="mt-2 text-gray-600">
              You agree to use our services lawfully and responsibly. Any
              misuse, hacking, or fraud will result in immediate suspension.
            </p>
          </div>

          {/* 3. Privacy Policy */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              3. Privacy Policy
            </h2>
            <p className="mt-2 text-gray-600">
              We respect your privacy. Please review our Privacy Policy to
              understand how we handle your personal data.
            </p>
          </div>

          {/* 4. Limitation of Liability */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              4. Limitation of Liability
            </h2>
            <p className="mt-2 text-gray-600">
              We are not responsible for any indirect, incidental, or
              consequential damages arising from your use of our services.
            </p>
          </div>

          {/* 5. Modifications */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              5. Modifications to Terms
            </h2>
            <p className="mt-2 text-gray-600">
              We may update these terms from time to time. Continued use of our
              services constitutes acceptance of the new terms.
            </p>
          </div>

          {/* 6. Contact Information */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              6. Contact Us
            </h2>
            <p className="mt-2 text-gray-600">
              If you have any questions about these terms, please contact us at
              <a
                href="mailto:bryan@gmail.com"
                className="text-blue-600 hover:underline"
              >
                {" "}
                bryan@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showButton && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition duration-200"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}
