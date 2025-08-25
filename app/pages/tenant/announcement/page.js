"use client";

import { Suspense } from "react";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";
import Announcements from "../../../../components/annoucemen/announcementList";
import { useSearchParams } from "next/navigation";
import useAuthStore from "../../../../zustand/authStore";

function AnnouncementWrapper() {
  const searchParams = useSearchParams();
  const agreementId = searchParams.get("agreement_id");

  const { user, fetchSession, loading } = useAuthStore();

  return (
      <TenantLayout agreement_id={agreementId}>
        <Announcements user_id={user?.user_id} agreement_id={agreementId} />
      </TenantLayout>
  );
}

export default function TenantAnnouncements() {
  return (
      <Suspense fallback={<div>Loading announcements...</div>}>
        <AnnouncementWrapper />
      </Suspense>
  );
}
