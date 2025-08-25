"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import InterestedTenants from "../../../../../../../components/landlord/prospective/InterestedTenants";
import LoadingScreen from "../../../../../../../components/loadingScreen";
import LandlordLayout from "../../../../../../../components/navigation/sidebar-landlord";
import useAuthStore from "../../../../../../../zustand/authStore";

export default function TenantRequest() {
  const { unitId } = useParams();
  const [loading, setLoading] = useState(true);
  const [landlordId, setLandlordId] = useState(null);
  const { fetchSession, user, admin } = useAuthStore();

  useEffect(() => {
    if (user) {
      setLandlordId(user.landlord_id);
      setLoading(false);
    }
  }, [user]);

  if (loading) return <LoadingScreen />;

  return (
    <LandlordLayout>
      <InterestedTenants unitId={unitId} landlordId={landlordId} />
    </LandlordLayout>
  );
}
