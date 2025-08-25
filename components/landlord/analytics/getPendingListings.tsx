"use client";

import { useEffect, useState } from "react";

interface PendingListingsCardProps {
    landlordId: string;
}

export default function PendingListingsCard({ landlordId }: PendingListingsCardProps) {
    const [pendingListings, setPendingListings] = useState<number | null>(null);

    useEffect(() => {
        const fetchPendingListings = async () => {
            try {
                const res = await fetch(`/api/analytics/landlord/getPendingListings?landlord_id=${landlordId}`);
                if (!res.ok) throw new Error("Failed to fetch pending listings");
                const data = await res.json();
                setPendingListings(data.pendingCount);
            } catch (error) {
                console.error("Error fetching pending listings:", error);
            }
        };

        fetchPendingListings();
    }, [landlordId]);

    return (
        <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-700">Pending Listings</h3>
            <p className="text-2xl font-bold text-gray-900">
                {pendingListings !== null ? pendingListings : "—"}
            </p>
        </div>
    );
}
