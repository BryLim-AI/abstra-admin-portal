"use client";

import { useState, useEffect, FormEvent, MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaSearch, FaMapMarkerAlt, FaSpinner } from "react-icons/fa";
import { HiBadgeCheck } from "react-icons/hi";
import Footer from "../components/navigation/footer";
import LoadingScreen from "@/components/loadingScreen";

interface Property {
  property_id: number;
  property_name: string;
  property_photo: string;
  city: string;
  street: string;
  province: string;
  rent_amount: number;
  verification_status: string;
}

interface PropertyCardProps {
  property: Property;
}

export default function SplashScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function redirectIfAuthenticated() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          console.log("User type detected:", data.userType);

          switch (data.userType) {
            case "tenant":
              router.replace("/pages//tenant/my-unit");
              return;
            case "landlord":
              router.replace("/pages/landlord/dashboard");
              return;
            case "admin":
              router.replace("/pages//admin/dashboard");
              return;
            default:
              router.replace("/pages/auth/login");
              return;
          }

        } else {
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setCheckingAuth(false); // Not logged in
      }
    }

    redirectIfAuthenticated();
  }, []);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const res = await fetch("/api/properties/findRent");
        if (!res.ok) throw new Error("Failed to fetch properties");

        const data = await res.json();
        setAllProperties(data);

        setFeaturedProperties(data.slice(0, 3));

        setRecentProperties(data.slice(0, 6));
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);


  if (checkingAuth) {
    return <LoadingScreen />;
  }
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/pages/find-rent?searchQuery=${searchQuery}`);
  };

  const navigateToFindRent = () => {
    router.push("/pages/find-rent");
  };

  const PropertyCard = ({ property }: PropertyCardProps) => {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => router.push(`/pages/find-rent/${property.property_id}`)}
      >
        {/* Property Image */}
        <div className="relative">
          {property?.property_photo ? (
            <div className="relative h-48">
              <Image
                src={property.property_photo}
                alt={property.property_name}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image Available</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {property?.property_name}
            </h2>
            <div className="flex items-center gap-1">
              <HiBadgeCheck className="text-blue-500 text-lg" />
              <span className="text-blue-600 font-medium text-sm">
                Verified
              </span>
            </div>
          </div>

          <div className="flex items-center text-gray-600 mt-2">
            <FaMapMarkerAlt className="mr-1 text-gray-400" />
            <p className="text-gray-800">
              {property?.city},{" "}
              {property?.province
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </p>
          </div>

          <p className="text-xl font-semibold text-blue-600 mt-1">
            ₱{Math.round(property.rent_amount).toLocaleString()}
          </p>

          <button
            className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 font-medium transition-colors"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation(); // Prevent event bubbling
              router.push(`/pages/find-rent/${property.property_id}`);
            }}
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative h-[500px]">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-section.jpeg"
            alt="Cityscape view of high-rise buildings"
            fill
            className="object-cover brightness-75"
            priority
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Rent with No Compromises
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl text-center">
            Enjoy a home that offers everything you've been searching for, all
            in one place.
          </p>

          <form
            onSubmit={handleSearch}
            className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-4 text-gray-800"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
                  <FaSearch className="text-gray-400 mx-3" />
                  <input
                    type="text"
                    placeholder="Search by property name, city, street, or province..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-3 px-2 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Featured Property
              </h2>
              <p className="text-gray-600">Recommended Place to Live for You</p>
            </div>
            <div className="flex space-x-2">
              <button
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                type="button"
              >
                <span className="sr-only">Previous</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                type="button"
              >
                <span className="sr-only">Next</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <FaSpinner className="animate-spin text-blue-500 text-3xl" />
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No properties found
              </h3>
              <p className="text-gray-500">
                Check back later for featured properties.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.property_id} property={property} />
              ))}
            </div>
          )}

          <div className="flex justify-center mt-8">
            <Link
              href="/pages/find-rent"
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Show all Property
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-900 text-white relative overflow-hidden">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 z-10 mb-10 lg:mb-0">
            <h3 className="text-lg font-medium mb-2">About Us</h3>
            <h2 className="text-3xl font-bold mb-4">
              Search, Find, and Invest in Good Properties with Us
            </h2>
            <p className="mb-6 opacity-80">
              Discover your perfect rental property with Hestia. We provide a
              curated selection of quality homes, apartments, and condominiums
              across the Philippines, making property hunting simple and
              stress-free.
            </p>
            <Link
              href="/pages/about-us"
              className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              Know More
            </Link>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="w-full h-64 lg:h-80 relative">
              <Image
                src="/images/aboutrent.jpeg"
                alt="Aerial view of properties"
                fill
                className="object-cover rounded-lg"
              />
              <h4 className="absolute bottom-4 right-4 bg-white bg-opacity-80 text-2xl font-bold text-blue-600 text-center px-4 py-2 rounded-lg shadow-lg">
                Hestia
              </h4>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Recently Added Property
              </h2>
              <p className="text-gray-600">Find Properties that suits you</p>
            </div>
            <div className="flex space-x-2">
              <button
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                type="button"
              >
                <span className="sr-only">Previous</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                type="button"
              >
                <span className="sr-only">Next</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <FaSpinner className="animate-spin text-blue-500 text-3xl" />
            </div>
          ) : recentProperties.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No properties found
              </h3>
              <p className="text-gray-500">
                Check back later for new properties.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProperties.map((property) => (
                <PropertyCard key={property.property_id} property={property} />
              ))}
            </div>
          )}

          <div className="flex justify-center mt-8">
            <Link
              href="/pages/find-rent"
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Show all Property
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
