'use client'

import ActiveListingsCard from "@/components/landlord/analytics/activeListings";
import PendingListingsCard from "@/components/landlord/analytics/getPendingListings";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import useAuthStore from "@/zustand/authStore";
import { useEffect } from "react";

export default function PropertyPerformancePage() {
    const { user, admin, loading, fetchSession } = useAuthStore();
    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin]);
    return (
        <LandlordLayout>

        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Property Performance
                </h1>
                <p className="text-gray-600">
                    Overview of your properties and their performance.
                </p>
            </header>

            {/* Filter Section */}

            {/*<div className="mb-6 bg-white p-4 rounded-lg shadow">*/}
            {/*    <h2 className="text-lg font-semibold text-gray-700 mb-3">Filters</h2>*/}
            {/*    <div className="flex flex-col md:flex-row gap-4">*/}
            {/*        <input*/}
            {/*            type="text"*/}
            {/*            placeholder="Search property..."*/}
            {/*            className="border rounded-md px-3 py-2 w-full md:w-1/3"*/}
            {/*        />*/}
            {/*        <select className="border rounded-md px-3 py-2 w-full md:w-1/4">*/}
            {/*            <option>All Status</option>*/}
            {/*            <option>Active</option>*/}
            {/*            <option>Pending</option>*/}
            {/*            <option>Archived</option>*/}
            {/*        </select>*/}
            {/*        <select className="border rounded-md px-3 py-2 w-full md:w-1/4">*/}
            {/*            <option>Sort by</option>*/}
            {/*            <option>Name</option>*/}
            {/*            <option>Date Added</option>*/}
            {/*        </select>*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* Property Cards Annalytics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <ActiveListingsCard landlordId = {user?.landlord_id}/>
                    <PendingListingsCard landlordId = {user?.landlord_id} />
            </div>
        </div>

        </LandlordLayout>
    );
}
