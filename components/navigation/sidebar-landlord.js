"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Building,
  Calendar,
  Wrench,
  Bell,
  CreditCard,
  Bug,
  MessageSquareMore,
  Menu,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { MdOutlinePayments } from "react-icons/md";
import { BsFilePersonFill } from "react-icons/bs";
import { IoAnalytics } from "react-icons/io5";

const menuItems = [
  { href: "/pages/landlord/dashboard", icon: Home, label: "Dashboard" },
  {
    href: "/pages/landlord/property-listing",
    icon: Building,
    label: "My Properties",
  },
  {
    href: "/pages/landlord/booking-appointment",
    icon: Calendar,
    label: "Bookings",
  },
  {
    href: "/pages/landlord/list_of_tenants",
    icon: BsFilePersonFill,
    label: "My Tenants",
  },
  {
    href: "/pages/landlord/payments",
    icon: MdOutlinePayments,
    label: "Payments",
  },
  {
    href: "/pages/landlord/analytics/performance",
    icon: IoAnalytics,
    label: "Performance",
  },
  { href: "/pages/landlord/chat", icon: MessageSquareMore, label: "Chats" },
  {
    href: "/pages/landlord/maintenance-request",
    icon: Wrench,
    label: "Maintenance",
  },

  { href: "/pages/landlord/announcement", icon: Bell, label: "Announcements" },
  // { href: "/pages/landlord/billing", icon: CreditCard, label: "Billing" },
  // {
  //   href: "/pages/landlord/payments",
  //   icon: CreditCard,
  //   label: "Payment History",
  // },

  { href: "/pages/commons/bug-report", icon: Bug, label: "Report a Bug" },
];

const LandlordLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  const handleNavigation = (label, href) => {
    Swal.fire({
      title: "Loading...",
      text: "Redirecting to " + label,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setTimeout(() => {
      router.push(href);
      Swal.close();
    }, 1000);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="md:hidden p-4 bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-900">Rent Management</h1>
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

      <div
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-white shadow-lg md:min-h-screen`}
      >
        <div className="hidden md:block p-6">
          <h1 className="text-xl font-bold text-blue-900">Rent Management</h1>
        </div>

        <nav className="px-4 py-2 md:py-0">
          <ul className="space-y-2">
            {menuItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <button
                    onClick={() => handleNavigation(label, href)}
                    className={`
                      flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-all duration-200
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "hover:bg-gray-100"
                      }
                    `}
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
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
};

export default LandlordLayout;
