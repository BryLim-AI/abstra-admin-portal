"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useAuthStore from "../../zustand/authStore";

export default function LandlordSubscriptionPlanComponent({ landlord_id }) {
  const { fetchSession, user } = useAuthStore();
  const [subscription, setSubscription] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (landlord_id) {
      fetch(`/api/landlord/subscription/active/${landlord_id}`)
        .then((response) => response.json())
        .then((data) => {
          setSubscription(data);
          setIsFetching(false);
        })
        .catch((error) => {
          setFetchError(error.message);
          setIsFetching(false);
        });
    }
  }, [landlord_id]);


  return (
    <div>
      <h1>Your Subscription Plan, {user?.firstName}</h1>
      <div>
        {subscription && subscription.plan_name ? (
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold text-blue-600">
              Your Subscription
            </h2>

            <p>
              <strong>Plan Name:</strong> {subscription?.plan_name}
            </p>
            <p>
              <strong>Start Date:</strong>{" "}
              {subscription?.start_date
                ? new Date(subscription.start_date).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )
                : "N/A"}
            </p>
            <p>
              <strong>End Date:</strong>{" "}
              {subscription?.end_date
                ? new Date(subscription.end_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) + " at 11:59 PM"
                : "N/A"}
            </p>
            <p>
              <strong>Payment Status:</strong> {subscription?.payment_status}
            </p>

            {subscription?.is_active === 0 ? (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-semibold">
                  ⚠ Your subscription has expired, your account is automatically
                  downgraded to the free plan!
                </p>
                <Link
                  href="/pages/landlord/sub_two/subscription"
                  onClick={() =>
                    logEvent(
                      "Subscription Expired",
                      "Subscription",
                      "User clicked to renew",
                      1
                    )
                  }
                  className="mt-2 inline-block bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Subscribe to a Plan
                </Link>
              </div>
            ) : (
              <>
                {subscription?.is_trial === 0 && (
                  <Link
                    href="/pages/landlord/sub_two/subscription"
                    onClick={() =>
                      logEvent(
                        "Upgrade Clicked",
                        "Subscription",
                        "User clicked upgrade",
                        1
                      )
                    }
                    className="mt-4 block bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded text-center"
                  >
                    Upgrade Plan
                  </Link>
                )}

                {subscription?.is_trial === 1 &&
                  subscription?.is_active === 1 && (
                    <>
                      <p className="text-green-600 font-semibold">
                        You are currently on a trial period until{" "}
                        {new Date(subscription.end_date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                        .
                      </p>
                      <Link
                        href="/pages/landlord/sub_two/upgrade"
                        onClick={() =>
                          logEvent(
                            "Trial User Subscription",
                            "Subscription",
                            "Trial user clicked subscribe",
                            1
                          )
                        }
                        className="mt-4 block bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded text-center"
                      >
                        Subscribe to a Plan
                      </Link>
                    </>
                  )}
              </>
            )}
          </div>
        ) : (
          <div>
            <p className="m-2">No active subscription found.</p>
            <Link
              href="/pages/landlord/sub_two/subscription"
              onClick={() =>
                logEvent(
                  "No Subscription",
                  "Subscription",
                  "User clicked subscribe",
                  1
                )
              }
              className="m-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Subscribe Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
