"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { Menu, X, History } from "lucide-react";
import useAuthStore from "../../zustand/authStore";
import { logEvent } from "../../utils/gtag";
import { IoSettings } from "react-icons/io5";
import { IoIosNotifications } from "react-icons/io";

export default function SideNavProfile() {
  const { user, signOutAdmin, signOut } = useAuthStore();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems = [
    {
      href: `/pages/${user?.userType}/profile`,
      icon: UserIcon,
      label: "Profile",
      onClick: () =>
        logEvent("Navigation", "User Interaction", "Clicked Profile Link", 1),
    },
    {
      href: `/pages/${user?.userType}/securityPrivacy`,
      icon: ShieldCheckIcon,
      label: "Security & Privacy",
      onClick: () =>
        logEvent(
          "Navigation",
          "User Interaction",
          "Clicked Security & Privacy Link",
          1
        ),
    },
    {
      href: `/pages/commons/settings`,
      icon: IoIosNotifications,
      label: "Other Settings",
      onClick: () =>
          logEvent("Navigation", "User Interaction", "Clicked Profile Link", 1),
    },
    ...(user?.userType === "landlord"
      ? [
          {
            href: "/pages/landlord/subsciption_plan",
            icon: CreditCardIcon,
            label: "View Subscription",
            onClick: () => {},
          },
        ]
      : []),

    {
      href: "#",
      icon: ArrowRightOnRectangleIcon,
      label: "Logout",
      onClick: () => {
        if (!user) return;
        // If userType exists, it's a regular user; otherwise, it's an admin
        if (user?.userType) {
          signOut(); // regular user logout
        } else {
          signOutAdmin(); // admin logout
        }
      },
    },
  ];

  return (
    <div className="flex-shrink-0">
      <div className="md:hidden relative z-30">
        <div className="p-4 bg-white shadow-sm flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-900">Menu</h1>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute w-full bg-white shadow-lg z-30">
            <nav className="px-4 py-2">
              <ul className="space-y-2 py-2">
                {menuItems.map(({ href, icon: Icon, label, onClick }) => {
                  const isActive = pathname === href;
                  return (
                    <li key={href + label}>
                      <Link
                        href={href}
                        className={`
                          flex items-center px-4 py-3 rounded-lg text-gray-700 transition-all duration-200
                          ${
                            isActive
                              ? "bg-blue-50 text-blue-700 font-bold"
                              : "hover:bg-gray-100"
                          }
                        `}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onClick && onClick();
                        }}
                      >
                        <Icon
                          className={`w-5 h-5 mr-3 ${
                            isActive ? "text-blue-700" : "text-gray-500"
                          }`}
                        />
                        <span>{label}</span>
                        {isActive && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-blue-600"></span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        )}
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-20"
          onClick={toggleMobileMenu}
        ></div>
      )}

      <div className="hidden md:block w-64 bg-white shadow-lg min-h-screen">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 mb-6">Menu</h1>
        </div>

        <nav className="px-4">
          <ul className="space-y-2">
            {menuItems.map(({ href, icon: Icon, label, onClick }) => {
              const isActive = pathname === href;
              return (
                <li key={href + label} className="py-2">
                  <Link
                    href={href}
                    className={`
                      flex items-center px-4 py-3 rounded-lg text-gray-700 transition-all duration-200
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "hover:bg-gray-100"
                      }
                    `}
                    onClick={() => {
                      onClick && onClick();
                    }}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 ${
                        isActive ? "text-blue-700" : "text-gray-500"
                      }`}
                    />
                    <span>{label}</span>
                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
