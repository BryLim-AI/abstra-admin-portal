
"use client";
import { useRouter, useParams  } from "next/navigation";
import TenantLayout from "../../../../../components/navigation/sidebar-tenant";
import useAuthStore from "../../../../../zustand/authStore";
import { useEffect, useState } from "react";
import LoadingScreen from "../../../../../components/loadingScreen";
import Announcements from "../../../../../components/annoucemen/announcement";
import LeaseDurationTracker from "../../../../../components/tenant/analytics-insights/LeaseAgreementWidget";
import TenantBillingTable from "../../../../../components/tenant/TenantBillingTable";
import TenantPendingPaymentWidget from "../../../../../components/tenant/PendingPaymentWidget";
import TenantPropertyChart from "../../../../../components/analytics/tenantAnalytics";
import axios from "axios";
import PaymentDueWidget from "@/components/tenant/analytics-insights/paymentDue";
import OverduePaymentWidget from "@/components/tenant/analytics-insights/overDuePayment";
import PaymentHistoryWidget from "@/components/tenant/analytics-insights/paymentHistoryWidget";
import AnnouncementWidget from "@/components/tenant/analytics-insights/announcementWidgets";

export default function RentPortalPage() {
  const { user, fetchSession } = useAuthStore();
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const [unitInfo, setUnitInfo] = useState<{ unit_name: string; property_name: string } | null>(null);
  const agreementId = params?.agreement_id;


 useEffect(() => {
    const fetchUnitName = async () => {
      try {
        const response = await axios.get(`/api/tenant/activeRent/unitInfo?agreement_id=${agreementId}`);
        setUnitInfo(response.data);
      } catch (error) {
        console.error("Failed to fetch unit name:", error);
      }
    };

    if (agreementId) fetchUnitName();
  }, [agreementId]);

//   if (loading || dataLoading) return <LoadingScreen />;

  if (!user) {
    return (
      <div className="p-6">
        <p>You need to be logged in to access the Rent Portal.</p>
      </div>
    );
  }

    return (
        // @ts-ignore

        <TenantLayout agreement_id={agreementId}>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">{unitInfo?.property_name} Unit {unitInfo?.unit_name} Portal </h1>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Manage all your rent-related activity here, for this unit.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-lg">
            <LeaseDurationTracker agreement_id={agreementId} />
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-lg">
            <PaymentDueWidget agreement_id={agreementId} />
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-lg">
            <OverduePaymentWidget agreement_id={agreementId} />
          </div>
        </div>

        {/*2 columns*/}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-3">
          <div className="w-full bg-white rounded-2xl shadow-md border border-gray-200 transition-transform transform hover:shadow-lg">
            <PaymentHistoryWidget agreement_id={agreementId} />
          </div>
          <div className="w-full bg-white rounded-2xl shadow-md border border-gray-200 transition-transform transform hover:shadow-lg">
            <AnnouncementWidget agreement_id={agreementId} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* <TenantBillingTable tenant_id={tenantId || user?.tenant_id} />
          <Announcements user_id={user?.user_id} /> */}
        </div>

        <div className="mt-6">
          {/* <TenantPropertyChart /> */}
        </div>
      </div>
    </TenantLayout>
  );
}