"use client";
import { useParams, useSearchParams } from "next/navigation";
import ProspectiveTenantDetails from "../../../../../../../components/landlord/prospective/ProspectiveTenantDetails";
import LandlordLayout from "../../../../../../../components/navigation/sidebar-landlord";

const TenantPage = () => {
  const { unitId } = useParams();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id");

  if (!unitId) {
    return <div>Error: Missing unit ID</div>;
  }

  return (
    <LandlordLayout>
      <ProspectiveTenantDetails unitId={unitId} tenantId={tenantId} />
    </LandlordLayout>
  );
};

export default TenantPage;
