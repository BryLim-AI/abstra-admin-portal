"use client";

import { useState, useEffect } from "react";
import useAuth from "../../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import LoadingScreen from "../../../../../components/loadingScreen";
import Swal from "sweetalert2";

// Convert to another constant file.
const plans = [
  {
    id: 1,
    name: "Free Plan",
    price: 0,
    trialDays: 0,
    popular: false,
    features: [
      "1 Property",
      "2 Property Listings",
      "Limited to 5 Maintenance Requests per property",
      "Mobile Access",
      "Limited Reports for Analytics",
      "Limited to 3 Prospective Tenant Lists",
      "Limited to 2 Billing Units",
    ],
  },
  {
    id: 2,
    name: "Standard Plan",
    price: 500,
    trialDays: 10,
    popular: true,
    features: [
      "Up to 5 Properties",
      "Up to 10 Property Listings",
      "Limited to 10 Maintenance Requests per property",
      "Mobile Access",
      "Analytics Reports",
      "Up to 10 Prospective Tenant Lists",
      "Limited to 10 Billing Units",
      "10-day Free Trial",
    ],
  },
  {
    id: 3,
    name: "Premium Plan",
    price: 1000,
    trialDays: 14,
    popular: false,
    features: [
      "Unlimited Properties",
      "Unlimited Property Listings",
      "Unlimited Maintenance Requests",
      "Mobile Access",
      "Analytics Reports",
      "Unlimited Prospective Tenant Lists",
      "Unlimited Billing Units",
      "14-day Free Trial",
    ],
  },
];

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [trialUsed, setTrialUsed] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [proratedAmount, setProratedAmount] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setDataLoading(true);

      try {

        //  Testing/Validating a user if they can avail free trial.
        const trialResponse = await fetch("/api/landlord/subscription/freeTrialTest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ landlord_id: user.landlord_id }),
        });

        const trialData = await trialResponse.json();
        setTrialUsed(trialData.is_trial_used);




        // Fetch Current Subscription
        const subscriptionResponse = await fetch(
          `/api/landlord/subscription/active/${user.landlord_id}`
        );

        if (!subscriptionResponse.ok) return;

        const subscriptionData = await subscriptionResponse.json();
        setCurrentSubscription(subscriptionData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setCurrentSubscription(null);
      } finally {
        setDataLoading(false);
      }
    }

    if (user) fetchData();
  }, [user]);

  const calculateProrate = (newPlan) => {
    if (!currentSubscription) return 0;

    const currentPlan = plans.find(
      (p) => p.name === currentSubscription.plan_name
    );
    if (!currentPlan || currentPlan.id === newPlan.id) return 0;

    const totalDays = 30;
    const remainingDays = Math.max(
      0,
      (new Date(currentSubscription.end_date) - new Date()) /
        (1000 * 60 * 60 * 24)
    );

    const dailyRateCurrent = currentPlan.price / totalDays;
    const dailyRateNew = newPlan.price / totalDays;

    const unusedAmount = dailyRateCurrent * remainingDays;
    const newCharge = newPlan.price - unusedAmount;

    return Math.max(newCharge, 0);
  };

  const handleSelectPlan = (plan) => {
    if (currentSubscription?.plan_name === plan.name) return;
    setSelectedPlan(plan);
    const proratedCost = calculateProrate(plan);
    setProratedAmount(parseFloat(proratedCost.toFixed(2)));
  };

  const handleProceed = async () => {
    if (!selectedPlan) {
      Swal.fire({
        icon: "warning",
        title: "Plan Required",
        text: "Please select a plan to proceed.",
      });
      return;
    }

    setProcessing(true);

    try {
      if (selectedPlan.id === 1) {
        // Free Plan logic
        const response = await fetch("/api/landlord/subscription/freeTrialTest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            landlord_id: user.landlord_id,
            plan_name: selectedPlan.name,
            is_free_plan: true,
          }),
        });

        if (response.status === 201) {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Free Plan activated successfully!",
          }).then(() => {
            router.push("/pages/landlord/dashboard");
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Failed to activate Free Plan.",
          });
        }
      }
      // For other PTiers except the Free.
      else if (!trialUsed && selectedPlan.trialDays > 0) {
        // Start free trial
        const response = await fetch("/api/landlord/subscription/freeTrialTest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            landlord_id: user.landlord_id,
            plan_name: selectedPlan.name,
          }),
        });

        if (response.status === 201) {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: `${selectedPlan.trialDays}-day free trial activated successfully!`,
          }).then(() => {
            router.push("/pages/landlord/dashboard");
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Failed to activate free trial.",
          });
        }
      } else {
        // PAID Tier

        // Determine the amount for checkout
        let amountToCharge;

        if (!currentSubscription && trialUsed) {
          // If there's NO current plan and the free trial is used, charge full price
          amountToCharge = selectedPlan.price;
        } else {
          // If there IS a current plan, apply proration
          amountToCharge = proratedAmount;
        }

        // Proceed to checkout
        router.push(
          `/pages/landlord/subscription/checkout?planId=${
            selectedPlan.id
          }&plan=${encodeURIComponent(
            selectedPlan.name
          )}&amount=${amountToCharge}&trialDays=${selectedPlan.trialDays}`
        );
      }
    } catch (error) {
      console.error("Error during trial activation:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (dataLoading) return <LoadingScreen />;
  if (!user) return;

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            Select the subscription that best fits your property management
            needs
          </p>
        </div>

        {!currentSubscription && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
            <p className="font-medium">
              You don’t have an active subscription.
            </p>
            <p className="text-sm">
              Please select a plan to continue using our services.
            </p>
          </div>
        )}

        {/* Subscription Status */}
        {currentSubscription && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Your Current Subscription
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  You are currently on the{" "}
                  <span className="font-semibold">
                    {currentSubscription?.plan_name}
                  </span>{" "}
                  plan
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg
                    className="mr-1.5 h-2 w-2 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Trial Status */}
        {!trialUsed && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md p-6 mb-8 text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Free Trial Available!</h3>
                <p className="mt-1">
                  You're eligible for a free trial of our premium features.
                  Select a plan to start.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_name === plan.name;
            const isSelectedPlan = selectedPlan?.id === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                className={`
                                relative bg-white rounded-2xl overflow-hidden transition-all duration-300
                                ${
                                  isCurrentPlan
                                    ? "opacity-60 cursor-not-allowed ring-2 ring-gray-300"
                                    : "cursor-pointer hover:shadow-xl transform hover:-translate-y-1"
                                } 
                                ${
                                  isSelectedPlan
                                    ? "ring-2 ring-blue-500 shadow-lg"
                                    : "shadow-md"
                                }
                            `}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
                    Popular
                  </div>
                )}

                <div className="p-8 border-b">
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ₱{plan.price}
                    </span>
                    <span className="ml-1 text-xl font-semibold">/month</span>
                  </div>
                  {plan.trialDays > 0 && !trialUsed && (
                    <p className="mt-4 text-sm text-blue-600 font-medium flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm11 14V6H4v10h12z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      {plan.trialDays}-day free trial
                    </p>
                  )}
                </div>

                <div className="px-8 pt-6 pb-8">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    What's included
                  </h4>
                  <ul className="mt-4 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-green-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <p className="ml-3 text-sm text-gray-700">{feature}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-6 py-4 bg-gray-50 text-center">
                  {isCurrentPlan ? (
                    <span className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white w-full">
                      Current Plan
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm
                                            ${
                                              isSelectedPlan
                                                ? "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                                            }
                                        `}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan);
                      }}
                    >
                      {isSelectedPlan ? "Selected" : "Select"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Prorate Notice */}
        {selectedPlan && currentSubscription && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-green-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Prorated Billing
                </h3>
                <p className="mt-1 text-gray-600">
                  We'll adjust your bill to account for your current
                  subscription. Your new total will be{" "}
                  <span className="font-semibold text-green-600">
                    ₱{proratedAmount?.toFixed(2)}
                  </span>{" "}
                  after applying the discount for unused days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          <button
            className={`
                        px-8 py-3 rounded-md text-base font-medium shadow-md transition-all duration-300
                        ${
                          !selectedPlan
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105"
                        }
                    `}
            disabled={!selectedPlan || processing}
            onClick={handleProceed}
          >
            {processing ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </div>
            ) : selectedPlan?.id === 1 ? (
              "Start Free Plan"
            ) : !trialUsed && selectedPlan?.trialDays > 0 ? (
              `Start ${selectedPlan?.trialDays}-Day Free Trial`
            ) : (
              "Proceed to Payment"
            )}
          </button>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden divide-y divide-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Can I change my plan later?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. When
                upgrading, we'll prorate your current subscription.
              </p>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Is there a long-term contract?
              </h3>
              <p className="mt-2 text-gray-600">
                No, all plans are billed monthly and you can cancel anytime.
              </p>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">
                What payment methods do you accept?
              </h3>
              <p className="mt-2 text-gray-600">
                We only accept payments through Maya.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
