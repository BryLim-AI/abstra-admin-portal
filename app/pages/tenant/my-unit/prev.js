"use client";
// to be deleted.
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useAuthStore from "../../../../zustand/authStore";
import TenantOutsidePortalNav from "../../../../components/navigation/TenantOutsidePortalNav";
import UnitCard from "@/components/landlord/properties/unitCards";
import {
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function MyUnit() {
  const { fetchSession, user } = useAuthStore();
  const router = useRouter();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [isSecurityPaid, setIsSecurityPaid] = useState(false);
  const [isAdvancedPaid, setIsAdvancedPaid] = useState(false);

  const [selectedItems, setSelectedItems] = useState({
    security_deposit: false,
    advance_rent: false,
  });

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        const { data } = await axios.get(`/api/tenant/activeRent?tenantId=${user.tenant_id}`);
        setUnits(data || []);
        setIsSecurityPaid(data.every(unit => unit.is_security_deposit_paid));
        setIsAdvancedPaid(data.every(unit => unit.is_advance_payment_paid));

        setSelectedItems({
          security_deposit: data.some(unit => !unit.is_security_deposit_paid && Number(unit.sec_deposit) > 0),
          advance_rent: data.some(unit => !unit.is_advance_payment_paid && Number(unit.advanced_payment) > 0),
        });
      } catch (err) {
        setError(err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitData();
  }, [user]);

  const requiresSecurity = units.some(unit => Number(unit?.sec_deposit) > 0);
  const requiresAdvanced = units.some(unit => Number(unit?.advanced_payment) > 0);

  const pendingSecurity = requiresSecurity && !isSecurityPaid;
  const pendingAdvanced = requiresAdvanced && !isAdvancedPaid;

  const getSelectedPaymentItemsPerUnit = () => {
    return units.map(unit => {
      const items = [];
      let total = 0;

      if (pendingSecurity && selectedItems.security_deposit && unit.sec_deposit > 0 && !unit.is_security_deposit_paid) {
        items.push({
          type: "security_deposit",
          name: `Security Deposit - ${unit.unit_name || unit.unit_id}`,
          amount: parseFloat(unit.sec_deposit),
        });
        total += parseFloat(unit.sec_deposit);
      }

      if (pendingAdvanced && selectedItems.advance_rent && unit.advanced_payment > 0 && !unit.is_advance_payment_paid) {
        items.push({
          type: "advance_rent",
          name: `Advance Rent - ${unit.unit_name || unit.unit_id}`,
          amount: parseFloat(unit.advanced_payment),
        });
        total += parseFloat(unit.advanced_payment);
      }

      return {
        unitId: unit.unit_id,
        items,
        totalAmount: total,
        canPayViaMaya: total > 0,
      };
    });
  };

  const handleUnitPayment = async (unitId) => {
    const unitPayment = getSelectedPaymentItemsPerUnit().find(u => u.unitId === unitId);
    if (!unitPayment || unitPayment.items.length === 0 || unitPayment.totalAmount <= 0) {
      Swal.fire("No Items Selected", "Nothing to pay for this unit.", "warning");
      return;
    }

    const itemDescriptions = unitPayment.items.map(item => item.name).join(" and ");

    const result = await Swal.fire({
      title: `Pay ${itemDescriptions}?`,
      text: `Pay ₱${unitPayment.totalAmount.toLocaleString()} for ${itemDescriptions}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Pay Now",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed || !user) return;

    setLoadingPayment(true);

    try {
      const payload = {
        agreement_id: units.find(u => u.unit_id === unitId)?.agreement_id,
        items: unitPayment.items.map(item => ({ type: item.type, amount: item.amount })),
        payment_method_id: 1,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        redirectUrl: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secSuccess`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secFailed`,
          cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secCancelled`,
        },
      };

      const response = await axios.post("/api/tenant/initialPayment", payload);
      if (response.status === 200) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error) {
      Swal.fire("Payment Failed", "An error occurred during payment.", "error");
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleContactLandlord = () => {
    if (!units?.[0]?.landlord_id) return;

    const chatRoom = `chat_${[user?.user_id, units[0].landlord_id].sort().join("_")}`;
    const chatUrl = `/pages/commons/chat?chat_room=${chatRoom}&landlord_id=${units[0].landlord_id}`;

    Swal.fire({
      title: "Redirecting...",
      text: "Taking you to the chat room...",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
      didClose: () => router.push(chatUrl),
    });
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  const unitPaymentItems = getSelectedPaymentItemsPerUnit();

  return (
      <div className="flex min-h-screen bg-gray-50">
        <TenantOutsidePortalNav />
        <div className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-indigo-900">My Unit</h1>
            <div className="flex gap-4">
              <button onClick={handleContactLandlord} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800">
                <ChatBubbleLeftRightIcon className="h-5 w-5" /> <span>Contact Landlord</span>
              </button>
              <button onClick={() => router.push("/pages/tenant/review")} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800">
                <PencilSquareIcon className="h-5 w-5" /> <span>Unit Feedback</span>
              </button>
            </div>
          </div>

          {units.length > 0 ? (
              <div className="space-y-6">
                {units.map(unit => {
                  const paymentData = unitPaymentItems.find(item => item.unitId === unit.unit_id);
                  return (
                      <UnitCard
                          key={unit.agreement_id}
                          unit={unit}
                          user={user}
                          router={router}
                          isAdvancePaid={unit.is_advance_payment_paid}
                          isSecurityPaid={unit.is_security_deposit_paid}
                          requiresSecurity={Number(unit.sec_deposit) > 0}
                          requiresAdvanced={Number(unit.advanced_payment) > 0}
                          itemsToPay={paymentData?.items || []}
                          totalAmount={paymentData?.totalAmount || 0}
                          canPayViaMaya={paymentData?.canPayViaMaya || false}
                          handlePayment={() => handleUnitPayment(unit.unit_id)}
                      />
                  );
                })}
              </div>
          ) : (
              <ErrorScreen error="You don't have any active leases." />
          )}
        </div>
      </div>
  );
}

const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-lg text-indigo-600">Loading your unit details...</span>
    </div>
);

const ErrorScreen = ({ error }) => (
    <div className="flex flex-col items-center justify-center h-screen px-6 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <div className="bg-red-50 p-4 rounded-full mb-6">
            <XCircleIcon className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No Active Lease Agreement</h2>
          <p className="text-gray-600 mb-2 text-center">You don't currently have an active lease agreement with any unit.</p>
          <div className="bg-red-50 p-3 rounded-lg w-full mb-6 mt-2">
            <p className="text-red-600 text-sm font-medium">{error || "Please complete the application process to establish a lease"}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex-1 flex items-center justify-center"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
);
