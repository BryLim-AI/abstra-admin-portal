import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const PropertyAnalytics = () => {
  const [propertyData, setPropertyData] = useState([]);
  const [verificationData, setVerificationData] = useState([]);
  const [leaseStatus, setLeaseStatus] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("properties");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const propertyResponse = await fetch("/api/analytics/getPropertyTypes");
        const propertyResult = await propertyResponse.json();
        setPropertyData(propertyResult.propertyTypes);

        const verificationResponse = await fetch(
          "/api/analytics/getVerificationStatus"
        );
        const verificationResult = await verificationResponse.json();
        setVerificationData(verificationResult.verificationStatus);

        const leaseResponse = await fetch(
          "/api/analytics/adminAnalytics/getLeaseActvive"
        );
        const leaseResult = await leaseResponse.json();
        setLeaseStatus(leaseResult.lease_status);

        const subscriptionResponse = await fetch(
          "/api/analytics/adminAnalytics/getSubscriptionDistribution"
        );
        const subscriptionResult = await subscriptionResponse.json();
        setSubscriptionData(subscriptionResult);

        const userResponse = await fetch(
          "/api/analytics/adminAnalytics/getUserDistribution"
        );
        const userResult = await userResponse.json();
        setUserData(userResult);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const barChartOptions = {
    chart: {
      type: "bar",
      toolbar: {
        show: false,
      },
      fontFamily: "Inter, sans-serif",
    },
    xaxis: {
      categories: propertyData.map((d) => d.type),
      labels: {
        style: {
          fontFamily: "Inter, sans-serif",
        },
      },
    },
    colors: ["#4F46E5"],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "60%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    title: {
      text: "Property Listings by Type",
      style: {
        fontSize: "16px",
        fontWeight: "600",
        fontFamily: "Inter, sans-serif",
      },
    },
    grid: {
      borderColor: "#f1f1f1",
    },
    tooltip: {
      theme: "light",
      style: {
        fontFamily: "Inter, sans-serif",
      },
    },
  };

  const barChartSeries = [
    {
      name: "Listings",
      data: propertyData.map((d) => d.count),
    },
  ];

  const pieChartOptions = {
    chart: {
      type: "pie",
      fontFamily: "Inter, sans-serif",
    },
    labels: verificationData.map((d) => d.status),
    title: {
      text: "Property Verification Status",
      style: {
        fontSize: "16px",
        fontWeight: "600",
        fontFamily: "Inter, sans-serif",
      },
    },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
      fontSize: "14px",
    },
    colors: ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"],
    tooltip: {
      theme: "light",
      style: {
        fontFamily: "Inter, sans-serif",
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const pieChartSeries = verificationData.map((d) => d.count);

  const labelsLease = leaseStatus.map((item) => item.status);
  const seriesLease = leaseStatus.map((item) => item.lease_count);

  const chartOptionsLease = {
    chart: {
      type: "pie",
      fontFamily: "Inter, sans-serif",
    },
    labels: labelsLease,
    title: {
      text: "Lease Status Distribution",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: "600",
        fontFamily: "Inter, sans-serif",
      },
    },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
      fontSize: "14px",
    },
    colors: ["#06B6D4", "#8B5CF6", "#EC4899", "#F97316"],
    tooltip: {
      theme: "light",
      y: {
        formatter: (val, { seriesIndex }) =>
          `${labelsLease[seriesIndex]}: ${val} Leases`,
      },
      style: {
        fontFamily: "Inter, sans-serif",
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const labelsSubscriptions = subscriptionData.map((item) => item.plan_name);
  const seriesSubscriptions = subscriptionData.map(
    (item) => item.subscriber_count
  );

  const chartOptionsSubscriptions = {
    chart: {
      type: "pie",
      fontFamily: "Inter, sans-serif",
    },
    labels: labelsSubscriptions,
    title: {
      text: "Subscription Plan Distribution",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: "600",
        fontFamily: "Inter, sans-serif",
      },
    },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
      fontSize: "14px",
    },
    colors: ["#2563EB", "#9333EA", "#14B8A6", "#F43F5E"],
    tooltip: {
      theme: "light",
      y: {
        formatter: (val, { seriesIndex }) =>
          `${labelsSubscriptions[seriesIndex]}: ${val} Subscribers`,
      },
      style: {
        fontFamily: "Inter, sans-serif",
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const labelsUsers = userData.map((item) => item.userType);
  const seriesUsers = userData.map((item) => item.user_count);

  const chartOptionsUsers = {
    chart: {
      type: "pie",
      fontFamily: "Inter, sans-serif",
    },
    labels: labelsUsers,
    title: {
      text: "User Distribution by Role",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: "600",
        fontFamily: "Inter, sans-serif",
      },
    },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
      fontSize: "14px",
    },
    colors: ["#059669", "#7C3AED", "#D97706", "#DC2626"],
    tooltip: {
      theme: "light",
      y: {
        formatter: (val, { seriesIndex }) =>
          `${labelsUsers[seriesIndex]}: ${val} Users`,
      },
      style: {
        fontFamily: "Inter, sans-serif",
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "properties":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <Chart
                  options={barChartOptions}
                  series={barChartSeries}
                  type="bar"
                  height={350}
                />
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <Chart
                  options={pieChartOptions}
                  series={pieChartSeries}
                  type="pie"
                  height={350}
                />
              )}
            </div>
          </div>
        );
      case "leases":
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <Chart
                options={chartOptionsLease}
                series={seriesLease}
                type="pie"
                height={350}
              />
            )}
          </div>
        );
      case "subscriptions":
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <Chart
                options={chartOptionsSubscriptions}
                series={seriesSubscriptions}
                type="pie"
                height={350}
              />
            )}
          </div>
        );
      case "users":
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <Chart
                options={chartOptionsUsers}
                series={seriesUsers}
                type="pie"
                height={350}
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Property Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive analytics and insights for your property management
            system
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
            <p className="text-gray-500 text-sm">Total Properties</p>
            <p className="text-2xl font-bold text-gray-800">
              {propertyData.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-emerald-500">
            <p className="text-gray-500 text-sm">Active Leases</p>
            <p className="text-2xl font-bold text-gray-800">
              {leaseStatus.find((status) => status.status === "Active")
                ?.lease_count || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-amber-500">
            <p className="text-gray-500 text-sm">Subscribers</p>
            <p className="text-2xl font-bold text-gray-800">
              {subscriptionData.reduce(
                (sum, item) => sum + item.subscriber_count,
                0
              )}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-violet-500">
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">
              {userData.reduce((sum, item) => sum + item.user_count, 0)}
            </p>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("properties")}
              className={`${
                activeTab === "properties"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab("leases")}
              className={`${
                activeTab === "leases"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Leases
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`${
                activeTab === "subscriptions"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`${
                activeTab === "users"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Users
            </button>
          </nav>
        </div>

        <div className="mb-8">{renderTabContent()}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Growth Metrics
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Property Listings
                  </span>
                  <span className="text-sm font-medium text-emerald-600">
                    +12.5%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: "70%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Active Users
                  </span>
                  <span className="text-sm font-medium text-emerald-600">
                    +8.2%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Premium Subscriptions
                  </span>
                  <span className="text-sm font-medium text-emerald-600">
                    +5.7%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    New property listing
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Lease agreement signed
                  </p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    New user registration
                  </p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyAnalytics;
