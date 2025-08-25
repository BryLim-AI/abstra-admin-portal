"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCheckCircle } from "react-icons/fa";

export default function ReviewingListing() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect after 1 second
    const timer = setTimeout(() => {
      router.push("/pages/landlord/property-listing");
    }, 3000);

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-semibold mb-4">Reviewing Listing</h1>
      <FaCheckCircle className="text-green-500 text-6xl mb-4" />
      <p className="text-lg text-center px-4">
        Your listing will be reviewed. We'll let you know once your listing is
        verified.
      </p>
      <button
        onClick={() => router.push("/pages/landlord/property-listing")}
        className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Finished
      </button>
    </div>
  );
}
