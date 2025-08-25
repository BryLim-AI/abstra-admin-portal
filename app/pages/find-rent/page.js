"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HiBadgeCheck } from "react-icons/hi";
import {
  FaSearch,
  FaChevronDown,
  FaMapMarkerAlt,
  FaSpinner,
  FaMap,
  FaEye,
  FaTimes,
  FaFilter,
  FaList,
  FaBed,
  FaBath,
  FaCar,
  FaHome,
  FaRuler,
  FaCouch,
} from "react-icons/fa";
import { BsImageAlt } from "react-icons/bs";
import { MdVerified, MdClose } from "react-icons/md";
import { HiOutlineAdjustments } from "react-icons/hi";
import Swal from "sweetalert2";
import axios from "axios";
import { logEvent } from "../../../utils/gtag";

// Dynamic imports for map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
import { useMap } from "react-leaflet";

function FlyToUserLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], 13);
    }
  }, [coords, map]);
  return null;
}

function FlyToProperty({ coords, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], zoom);
    }
  }, [coords, map, zoom]);
  return null;
}

export default function PropertySearch() {
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [priceRange, setPriceRange] = useState("");
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedPropertyUnits, setSelectedPropertyUnits] = useState([]);
  const [visibleMaps, setVisibleMaps] = useState({});
  const [markerIcon, setMarkerIcon] = useState(null);
  const [viewMode, setViewMode] = useState("map"); // 'map' or 'list'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredProperty, setHoveredProperty] = useState(null);
  const [mapCenter, setMapCenter] = useState(null); // For flying to property location

  // Map specific states
  const [userCoords, setUserCoords] = useState(null);
  const [userIcon, setUserIcon] = useState(null);
  const [propertyIcon, setPropertyIcon] = useState(null);

  const priceRanges = [
    { label: "All Prices", min: "", max: "" },
    { label: "₱1,000 - ₱15,000", min: 1000, max: 15000 },
    { label: "₱15,000 - ₱20,000", min: 15000, max: 20000 },
    { label: "Greater than ₱20,000", min: 20000, max: "" },
  ];

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const res = await fetch("/api/properties/findRent");
        if (!res.ok) throw new Error("Failed to fetch properties");

        const data = await res.json();
        setAllProperties(data);
        setFilteredProperties(data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");

      // Fix leaflet marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/marker.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      // User location icon
      const userLocationIcon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/4872/4872521.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        className: "animate-pulse",
      });
      setUserIcon(userLocationIcon);

      // Property marker icon
      const propIcon = new L.Icon({
        iconUrl: "/marker.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
      setPropertyIcon(propIcon);

      const icon = new L.Icon({
        iconUrl: "/marker.png",
        iconSize: [30, 30],
        iconAnchor: [12, 41],
        popupAnchor: [0, -41],
      });
      setMarkerIcon(icon);
    }
  }, []);

  // Get user location
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }
  }, []);

  const handleToggleMap = (e, propertyId) => {
    e.stopPropagation();
    setVisibleMaps((prev) => ({
      ...prev,
      [propertyId]: !prev[propertyId],
    }));
  };

  const handleViewDetails = (propertyId) => {
    Swal.fire({
      title: "Loading...",
      text: "Redirecting to property details...",
      allowOutsideClick: true,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setTimeout(() => {
      Swal.close();
      router.push(`/pages/find-rent/${propertyId}`);
    }, 1500);
  };

  // Handle property click on map
  const handlePropertyClick = async (property) => {
    try {
      setSelectedProperty(property);
      const response = await axios.get(
        `/api/properties/findRent/viewPropertyDetails?id=${property.property_id}`
      );
      setSelectedPropertyUnits(response.data.units || []);
    } catch (error) {
      console.error("Failed to fetch property units:", error);
      setSelectedPropertyUnits([]);
    }
  };

  // Handle property click from sidebar - fly to map location
  const handleSidebarPropertyClick = async (property) => {
    if (property.latitude && property.longitude) {
      // Set map center to fly to this property
      setMapCenter({
        lat: parseFloat(property.latitude),
        lng: parseFloat(property.longitude),
      });
    }
    // Also load the property details
    await handlePropertyClick(property);
  };

  const handleViewUnitDetails = (unitId) => {
    // Log the event before navigation
    logEvent({
      action: "view_unit_details",
      params: {
        property_id: selectedProperty.property_id,
        unit_id: unitId,
      },
    });

    // Navigate to the unit details page
    router.push(`/pages/find-rent/${selectedProperty.property_id}/${unitId}`);
  };


  const handleViewPropertyDetails = () => {
    router.push(`/pages/find-rent/${selectedProperty.property_id}`);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get("searchQuery");
      const locationParam = params.get("location");
      const typeParam = params.get("type");

      if (queryParam) setSearchQuery(queryParam);
    }
  }, []);

  useEffect(() => {
    const filtered = allProperties.filter((property) => {
      const matchesSearch =
        searchQuery === "" ||
        property.property_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.street.toLowerCase().includes(searchQuery.toLowerCase());

      const selectedRange = priceRanges.find(
        (range) => range.label === priceRange
      );
      const minPrice = selectedRange?.min || 0;
      const maxPrice = selectedRange?.max || Infinity;

      const matchesPrice =
        priceRange === "" ||
        (property.rent_amount >= minPrice && property.rent_amount <= maxPrice);

      return matchesSearch && matchesPrice;
    });

    setFilteredProperties(filtered);
  }, [searchQuery, priceRange, allProperties]);

  const defaultCenter = userCoords || { lat: 14.5995, lng: 120.9842 };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Search Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            {/* Search Input */}
            <div className="flex-1 sm:max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search location, property name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Price Filter */}
              <div className="relative flex-1 sm:flex-initial">
                <button
                  onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                >
                  <HiOutlineAdjustments className="text-gray-500" />
                  <span className="font-medium truncate">
                    {priceRange || "Price Range"}
                  </span>
                  <FaChevronDown
                    className={`text-xs transition-transform ${
                      showPriceDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showPriceDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    {priceRanges.map((range) => (
                      <button
                        key={range.label}
                        onClick={() => {
                          setPriceRange(range.label);
                          setShowPriceDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          priceRange === range.label
                            ? "bg-blue-50 text-blue-700"
                            : ""
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === "map"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <FaMap className="inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Map</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <FaList className="inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>

              {/* Results count */}
              <div className="hidden sm:block text-sm text-gray-600 whitespace-nowrap">
                {filteredProperties.length} properties
              </div>
            </div>
          </div>

          {/* Mobile Results Count */}
          <div className="sm:hidden mt-2 text-sm text-gray-600 text-center">
            {filteredProperties.length} properties found
          </div>

          {/* Active Filters */}
          {(searchQuery || (priceRange && priceRange !== "All Prices")) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {searchQuery && (
                <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm">
                  "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              )}
              {priceRange && priceRange !== "All Prices" && (
                <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs sm:text-sm">
                  {priceRange}
                  <button
                    onClick={() => setPriceRange("")}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {viewMode === "list" ? (
          /* List View */
          <div className="flex-1 overflow-auto p-2 sm:p-4">
            {filteredProperties.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FaSearch className="text-gray-300 text-4xl mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-500 mb-4 text-sm sm:text-base">
                  Try adjusting your search criteria
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPriceRange("");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProperties.map((property) => (
                  <div
                    key={property.property_id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
                  >
                    {/* Property Image */}
                    <div className="relative group">
                      {property?.property_photo ? (
                        <div className="relative h-40 sm:h-48 overflow-hidden">
                          <Image
                            src={property?.property_photo}
                            alt={property?.property_name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 sm:h-48 bg-gray-100 flex items-center justify-center">
                          <BsImageAlt className="text-2xl sm:text-3xl text-gray-400" />
                        </div>
                      )}

                      {/* FlexiPay Badge */}
                      {property?.flexipay_enabled === 1 && (
                        <div className="absolute top-3 right-3">
                          <div className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                            FlexiPay ✓
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="p-3 sm:p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                          ₱{Math.round(property.rent_amount).toLocaleString()}
                          <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1">
                            /month
                          </span>
                        </h3>
                        <MdVerified className="text-blue-500 text-lg flex-shrink-0" />
                      </div>

                      <h4 className="font-medium text-gray-800 mb-1 line-clamp-1 text-sm sm:text-base">
                        {property?.property_name}
                      </h4>

                      <div className="flex items-center text-gray-600 mb-3">
                        <FaMapMarkerAlt className="mr-1 text-gray-400 text-xs flex-shrink-0" />
                        <p className="text-xs sm:text-sm truncate">
                          {property?.city},{" "}
                          {property?.province
                            ?.split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </p>
                      </div>

                      {/* Single Button - View Details Only */}
                      <button
                        onClick={() => handleViewDetails(property.property_id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        View Details
                      </button>

                      {/* Inline Map */}
                      {visibleMaps[property.property_id] && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                          {property.latitude && property.longitude ? (
                            <div className="h-40">
                              <MapContainer
                                center={[
                                  parseFloat(property.latitude),
                                  parseFloat(property.longitude),
                                ]}
                                zoom={15}
                                style={{ height: "100%", width: "100%" }}
                              >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker
                                  position={[
                                    parseFloat(property.latitude),
                                    parseFloat(property.longitude),
                                  ]}
                                  icon={propertyIcon}
                                >
                                  <Popup>
                                    <div className="text-center p-2">
                                      <strong>{property.property_name}</strong>
                                    </div>
                                  </Popup>
                                </Marker>
                              </MapContainer>
                            </div>
                          ) : (
                            <div className="h-20 bg-gray-100 flex items-center justify-center">
                              <p className="text-red-500 text-sm">
                                Invalid coordinates
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Map View */
          <>
            {/* Sidebar */}
            <div
              className={`bg-white border-r border-gray-200 transition-all duration-300 ${
                sidebarOpen ? "w-full sm:w-96" : "w-0"
              } overflow-hidden ${
                sidebarOpen ? "absolute sm:static inset-0 z-10 sm:z-auto" : ""
              }`}
            >
              <div className="h-full flex flex-col">
                {/* Sidebar Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 text-sm sm:text-base">
                      Properties ({filteredProperties.length})
                    </h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MdClose className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Property List */}
                <div className="flex-1 overflow-auto">
                  {filteredProperties.length === 0 ? (
                    <div className="p-4 text-center">
                      <FaSearch className="text-gray-300 text-3xl mx-auto mb-3" />
                      <p className="text-gray-500 text-sm sm:text-base">
                        No properties found
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredProperties.map((property) => (
                        <div
                          key={property.property_id}
                          className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            hoveredProperty === property.property_id
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onMouseEnter={() =>
                            setHoveredProperty(property.property_id)
                          }
                          onMouseLeave={() => setHoveredProperty(null)}
                          onClick={() => handleSidebarPropertyClick(property)}
                        >
                          <div className="flex gap-3">
                            {/* Property Image */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {property?.property_photo ? (
                                <Image
                                  src={property?.property_photo}
                                  alt={property?.property_name}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BsImageAlt className="text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Property Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-lg">
                                  ₱
                                  {Math.round(
                                    property.rent_amount
                                  ).toLocaleString()}
                                  <span className="text-xs font-normal text-gray-500 ml-1">
                                    /mo
                                  </span>
                                </h3>
                                {property?.flexipay_enabled === 1 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    FlexiPay
                                  </span>
                                )}
                              </div>

                              <h4 className="font-medium text-gray-800 text-xs sm:text-sm mb-1 line-clamp-1">
                                {property?.property_name}
                              </h4>

                              <div className="flex items-center text-gray-500 text-xs mb-2">
                                <FaMapMarkerAlt className="mr-1 flex-shrink-0" />
                                <span className="truncate">
                                  {property?.city},{" "}
                                  {property?.province
                                    ?.split("_")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1)
                                    )
                                    .join(" ")}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(property.property_id);
                                  }}
                                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="absolute top-4 left-4 z-10 bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <FaList className="text-gray-600 mr-1 sm:mr-2 inline" />
                  <span className="text-xs sm:text-sm font-medium">
                    Show List ({filteredProperties.length})
                  </span>
                </button>
              )}

              {/* Map Legend */}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 sm:p-4 z-10 max-w-[150px] sm:max-w-none">
                <h3 className="font-bold text-gray-800 mb-2 text-xs sm:text-sm">
                  Map Legend
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                    <span>Your Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500 text-sm flex-shrink-0" />
                    <span>Properties</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click markers to view units
                </p>
              </div>

              {/* Leaflet Map */}
              <div className="h-full w-full relative z-0">
                <MapContainer
                  center={defaultCenter}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Fly to property when mapCenter changes */}
                  {mapCenter && <FlyToProperty coords={mapCenter} />}

                  {/* User Location Marker */}
                  {userCoords && userIcon && (
                    <Marker
                      position={[userCoords.lat, userCoords.lng]}
                      icon={userIcon}
                    >
                      <Popup>
                        <div className="text-center p-2">
                          <strong>📍 You are here</strong>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Property Markers */}
                  {filteredProperties
                    .filter(
                      (property) =>
                        !isNaN(parseFloat(property.latitude)) &&
                        !isNaN(parseFloat(property.longitude))
                    )
                    .map((property) => (
                      <Marker
                        key={property.property_id}
                        position={[
                          parseFloat(property.latitude),
                          parseFloat(property.longitude),
                        ]}
                        icon={propertyIcon}
                        eventHandlers={{
                          click: () => handlePropertyClick(property),
                        }}
                      >
                        <Popup>
                          <div className="w-64 p-2">
                            <div className="flex items-center mb-2">
                              <h3 className="font-bold text-gray-800 flex-1">
                                {property.property_name}
                              </h3>
                              <MdVerified className="text-blue-500 ml-2" />
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                              {property.street}, {property.city},{" "}
                              {property.province}
                            </p>

                            <p className="text-lg font-bold text-blue-600 mb-3">
                              ₱
                              {Math.round(
                                property.rent_amount
                              ).toLocaleString()}
                              /month
                            </p>

                            <button
                              onClick={() => handlePropertyClick(property)}
                              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                            >
                              View Units
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                  <FlyToUserLocation coords={userCoords} />
                </MapContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Property Details Sidebar (Map View Only) - Fixed positioning */}
      {viewMode === "map" && selectedProperty && (
        <div className="fixed top-16 sm:top-20 right-2 sm:right-4 w-[calc(100vw-1rem)] sm:w-80 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] bg-white shadow-xl z-[1000] overflow-y-auto border border-gray-200 rounded-lg">
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-blue-50 sticky top-0 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                  <span className="truncate">
                    {selectedProperty.property_name}
                  </span>
                  <MdVerified className="text-blue-500 ml-2 flex-shrink-0" />
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {selectedProperty.city}, {selectedProperty.province}
                </p>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-500 hover:text-gray-700 p-1 ml-2 flex-shrink-0"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {/* Property Image */}
            {selectedProperty.property_photo ? (
              <div className="relative h-32 sm:h-40 rounded-lg overflow-hidden mb-4">
                <Image
                  src={selectedProperty.property_photo}
                  alt={selectedProperty.property_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-32 sm:h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <BsImageAlt className="text-2xl sm:text-3xl text-gray-400" />
              </div>
            )}

            {/* Property Info */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FaHome className="text-blue-500 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
                  Property Type:
                </span>
                <span className="text-gray-600 capitalize text-sm sm:text-base">
                  {selectedProperty.property_type}
                </span>
              </div>

              {selectedProperty.flexipay_enabled === 1 && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full mb-3">
                  <span>FlexiPay Available</span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* View Property Button */}
            <button
              onClick={handleViewPropertyDetails}
              className="w-full py-2 mb-4 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium text-sm sm:text-base"
            >
              View Property Details
            </button>

            {/* Units List */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">
                Available Units
              </h3>

              {selectedPropertyUnits.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Loading units...
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedPropertyUnits.map((unit) => {
                    const isOccupied = unit.status === "occupied";
                    return (
                      <div
                        key={unit.unit_id}
                        className={`border rounded-lg p-3 ${
                          isOccupied
                            ? "border-red-200 bg-red-50"
                            : "border-green-200 bg-green-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
                            Unit {unit.unit_name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                              isOccupied
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            {isOccupied ? "Occupied" : "Available"}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs sm:text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <FaRuler className="text-gray-400 flex-shrink-0" />
                            <span>{unit.unit_size} sqm</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaCouch className="text-gray-400 flex-shrink-0" />
                            <span className="capitalize">
                              {unit.furnish.replace(/_/g, " ")}
                            </span>
                          </div>
                          {unit.bed_spacing !== 0 && (
                            <div className="flex items-center gap-2">
                              <FaBed className="text-gray-400 flex-shrink-0" />
                              <span>{unit.avail_beds} beds available</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-bold text-blue-600 text-sm sm:text-base">
                            ₱{unit.rent_amount.toLocaleString()}/month
                          </span>
                          <button
                            onClick={() => handleViewUnitDetails(unit.unit_id)}
                            className={`px-3 py-1 text-xs rounded-lg font-medium flex items-center gap-1 flex-shrink-0 ${
                              isOccupied
                                ? "bg-gray-200 text-gray-600"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            <FaEye />
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
