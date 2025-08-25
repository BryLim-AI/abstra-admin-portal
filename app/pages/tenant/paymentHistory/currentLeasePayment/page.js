"use client";
import TenantLeasePayments from "../../../../../components/tenant/currentLeasePaymentHistory";
import useAuthStore from "../../../../../zustand/authStore";
import TenantLayout from "../../../../../components/navigation/sidebar-tenant";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TenantPaymentsContent() {
    const { user, fetchSession, loading } = useAuthStore();
    const searchParams = useSearchParams();
    const agreementId = searchParams.get("agreement_id");
  return (
    <TenantLayout agreement_id={agreementId}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Payments History</h1>
        <TenantLeasePayments  agreement_id={agreementId} />
      </div>
    </TenantLayout>
  );
}

export default function TenantPayments(){
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TenantPaymentsContent />
        </Suspense>
    );
}