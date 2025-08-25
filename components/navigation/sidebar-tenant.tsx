"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Bell,
  MessageCircle,
  Wrench,
  CreditCard,
  Menu,
  X,
  ReceiptText,
} from "lucide-react";
import Swal from "sweetalert2";

interface TenantLayoutProps {
  children: React.ReactNode;
  agreement_id?: string | number;
}

const TenantLayout = ({ children, agreement_id }: TenantLayoutProps) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (label: string, href: string) => {
    Swal.fire({
      title: "Loading...",
      text: `Redirecting to ${label}`,
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

  const menuItems = [
    { slug: "rentalPortal", icon: Home, label: "Dashboard" },
    { slug: "announcement", icon: Bell, label: "Announcements" },
    { slug: "maintenance", icon: Wrench, label: "Maintenance Request" },
    { slug: "billing", icon: CreditCard, label: "Billing Statement" },
    {
      slug: "paymentHistory/currentLeasePayment",
      icon: ReceiptText,
      label: "Payment History",
    },
  ].map(({ slug, ...rest }) => {
    let href = `/pages/tenant/${slug}`;
    if (slug === "rentalPortal" && agreement_id) {
      href = `/pages/tenant/${slug}/${agreement_id}`; // special case for dashboard
    } else if (agreement_id) {
      href = `/pages/tenant/${slug}?agreement_id=${agreement_id}`;
    }
    return { href, ...rest };
  });


  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Mobile Header */}
      <div className="md:hidden p-4 bg-white shadow-sm flex justify-between items-center">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      {/* Sidebar Navigation - only if agreement_id exists */}
      {agreement_id && (
          <div
              className={`${
                  isMobileMenuOpen ? "block" : "hidden"
              } md:block w-full md:w-64 bg-white shadow-lg md:min-h-screen`}
          >
            <div className="hidden md:block p-6">
            </div>

            <nav className="px-4 py-2 md:py-0">
              <ul className="space-y-2">
                {menuItems.map(({ href, icon: Icon, label }) => {
                  const isActive = pathname.includes(href.split("?")[0]);
                  return (
                      <li key={href}>
                        <button
                            onClick={() => handleNavigation(label, href)}
                            className={`flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-all duration-200 ${
                                isActive ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-gray-100"
                            }`}
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
      )}


      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
};

export default TenantLayout;
