"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import useAuthStore from "../../../../zustand/authStore";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";
import MaintenanceRequestList from "../../../../components/tenant/currentRent/currentMaintainance/maintenance";

function TenantMaintenanceContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const agreementId = searchParams.get("agreement_id");

  return (
      <TenantLayout agreement_id={agreementId}>
        <MaintenanceRequestList
            agreement_id={agreementId}
            user_id={user?.user_id}
        />
      </TenantLayout>
  );
}

export default function TenantMaintenance() {
  return (
      <Suspense fallback={<div>Loading...</div>}>
        <TenantMaintenanceContent />
      </Suspense>
  );
}
