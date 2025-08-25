"use client";
import { useParams, useSearchParams } from "next/navigation";
import LandlordLayout from "../../../../../../../../components/navigation/sidebar-landlord";
import LeaseDetails from "../../../../../../../../components/landlord/properties/LeaseDetails";

const ViewUnitTenantPage = () => {
  const { unitId } = useParams();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id");

  if (!unitId) {
    return <div>Error: Missing unit ID</div>;
  }

  return (
    <LandlordLayout>
      <LeaseDetails unitId={unitId} />
    </LandlordLayout>
  );
};

export default ViewUnitTenantPage;
