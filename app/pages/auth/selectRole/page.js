"use client";

import useRoleStore from "../../../../zustand/store";
import { logEvent } from "../../../../utils/gtag";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { UserIcon, HomeIcon } from "@heroicons/react/24/solid";

export default function RegisterAs() {
  const setRole = useRoleStore((state) => state.setRole);
  const router = useRouter();

  const handleSelectRole = (role) => {
    setRole(role);
    router.push("/pages/auth/register");
    logEvent("Role Selection", "User Interaction", `Selected Role: ${role}`, 1);
  };

  return (
      <div className="relative flex justify-center items-center min-h-screen bg-gray-100 overflow-hidden px-4 py-10 sm:py-16">
        <Image
            src="/images/hero-section.jpeg"
            alt="Cityscape view of high-rise buildings"
            fill
            className="absolute inset-0 object-cover brightness-75"
            priority
        />

        <div className="relative z-10 bg-white p-8 sm:p-12 rounded-3xl shadow-2xl w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="text-4xl font-extrabold text-blue-600 tracking-wide">Hestia</div>
          </div>

          {/* Heading */}
          <h2 className="text-center text-3xl font-semibold text-gray-900 mb-10">
            Register As
          </h2>

          {/* Side-by-side buttons */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Tenant Button */}
            <button
                className="flex-1 flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-xl shadow-lg hover:bg-blue-700 transition"
                type="button"
                onClick={() => handleSelectRole("tenant")}
            >
              <UserIcon className="w-7 h-7" />
              <span className="text-lg font-medium">Tenant</span>
            </button>

            {/* Landlord Button */}
            <button
                className="flex-1 flex items-center justify-center gap-3 bg-green-600 text-white py-4 rounded-xl shadow-lg hover:bg-green-700 transition"
                type="button"
                onClick={() => handleSelectRole("landlord")}
            >
              <HomeIcon className="w-7 h-7" />
              <span className="text-lg font-medium">Landlord</span>
            </button>
          </div>
        </div>
      </div>
  );
}
