"use client";
import LandlordSubscriptionPlanComponent from "../../../../components/landlord/subscrription";
import SideNavProfile from "../../../../components/navigation/sidebar-profile";
import useAuthStore from "../../../../zustand/authStore";
import { useEffect } from "react";

export default function LandlordSubscriptionPlan() {
  const { fetchSession, user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      fetchSession();
    }
  }, [user]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNavProfile />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Subscription Policy
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Everything you need to know about our subscription plans and
                  policies
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 mb-6 lg:mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-start sm:items-center mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Upgrade Policy
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Hestia offers a flexible upgrade policy for subscription
                  plans. If you choose to upgrade your plan before the current
                  billing cycle ends, the additional cost will be pro-rated
                  based on the remaining days of your subscription. This ensures
                  you only pay for the difference in service level for the time
                  used.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-start sm:items-center mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Free Trial Policy
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Each user is eligible for only one free trial period. If a
                  user has previously used a free trial, they will not be
                  eligible for another. Users are not required to provide
                  payment details upon signing up for the free trial.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-start sm:items-center mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Refund Policy
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Hestia does not offer refunds for subscriptions once a
                  payment has been processed.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Select the subscription plan that best fits your needs
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <LandlordSubscriptionPlanComponent
                landlord_id={user?.landlord_id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}