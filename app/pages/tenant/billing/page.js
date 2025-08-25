"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import useAuthStore from "../../../../zustand/authStore";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";
import TenantBilling from "../../../../components/tenant/billing/currentBilling";
import PreviousBilling from "../../../../components/tenant/billing/prevBillingList";

function BillingContent() {
  const { user, fetchSession } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const agreementId = searchParams.get("agreement_id");

  useEffect(() => {
    const init = async () => {
      console.log("[DEBUG] Initial user:", user);
      if (!user) {
        await fetchSession();
      } else {
        console.log("[DEBUG] User already available:", user);
      }
      setLoading(false);
    };
    init();
  }, [user, fetchSession]);

  if (loading || !user) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  return (
      <TenantLayout agreement_id={agreementId}>
        <TenantBilling agreement_id={agreementId} user_id={user.user_id} />
        <PreviousBilling agreement_id={agreementId} user_id={user.user_id} />
      </TenantLayout>
  );
}




export default function TenantBillingPage() {
  return (
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Loading billing data...</div>}>
        <BillingContent />
      </Suspense>
  );
}
