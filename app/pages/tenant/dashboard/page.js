//  to be removed. change to my unit. no more dashboard

"use client";
import { useRouter } from "next/navigation";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";
import useAuthStore from "../../../../zustand/authStore";
import { useEffect, useState } from "react";
import LoadingScreen from "../../../../components/loadingScreen";
import Announcements from "../../../../components/annoucemen/announcement";
import LeaseAgreementWidget from "../../../../components/tenant/analytics-insights/LeaseAgreementWidget";
import TenantBillingTable from "../../../../components/tenant/TenantBillingTable";
import TenantPendingPaymentWidget from "../../../../components/tenant/PendingPaymentWidget";
import TenantPropertyChart from "../../../../components/analytics/tenantAnalytics";

export default function TenantDashboard() {
  const { user, fetchSession, loading } = useAuthStore();
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const [billingHistory, setBillingHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        await fetchSession();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user?.tenant_id]);

  useEffect(() => {
    if (!loading && !user && !admin) {
    }
  }, [user, loading, router]);

  if (loading || dataLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <p>You need to log in to access the dashboard.</p>;
  }
  return (
    <TenantLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {user?.firstName} {user?.lastName}!
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <TenantPendingPaymentWidget tenant_id={user?.tenant_id} />
          <LeaseAgreementWidget tenant_id={user?.tenant_id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2">
            <TenantBillingTable tenant_id={user?.tenant_id} />
            <Announcements user_id={user?.user_id} />
          </div>
          <div className="lg:col-span-2">
            <TenantPropertyChart />
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
