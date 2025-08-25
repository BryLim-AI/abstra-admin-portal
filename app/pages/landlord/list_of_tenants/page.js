'use client'


import useAuthStore from "../../../../zustand/authStore";
import TenantListLandlords from "../../../../components/landlord/properties/listOfCurrentTenants";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";


export default function LandlordsTenantsListPage() {
  const { fetchSession, user, admin } = useAuthStore();
    return (
        <LandlordLayout>
        <div className="container mx-auto p-4">
            <TenantListLandlords landlord_id={user?.landlord_id} />
        </div>
        </LandlordLayout>
    );
}
