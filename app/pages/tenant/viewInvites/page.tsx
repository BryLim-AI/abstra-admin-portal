"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";

type Invite = {
    code: string;
    propertyName: string;
    unitName: string;
    createdAt: string;
};

export default function TenantInvites() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvites = async () => {
            if (!user?.email) return;

            try {
                const res = await fetch(`/api/invite?email=${user.email}`);
                if (!res.ok) throw new Error("Failed to fetch invites");
                const data = await res.json();
                setInvites(data.invites || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvites();
    }, [user?.email]);

    return (
        <div className="max-w-2xl mx-auto mt-10 px-4">
            <h1 className="text-2xl font-bold mb-6">Pending Invitations</h1>

            {loading ? (
                <p className="text-gray-500">Loading invitations...</p>
            ) : invites.length > 0 ? (
                <div className="space-y-4">
                    {invites.map((invite) => (
                        <div
                            key={invite.code}
                            className="p-4 border rounded-md shadow-sm bg-white"
                        >
                            <p className="text-sm text-gray-700">
                                <strong>Property:</strong> {invite.propertyName}
                            </p>
                            <p className="text-sm text-gray-700">
                                <strong>Unit:</strong> {invite.unitName}
                            </p>
                            <button
                                onClick={() => router.push(`/tenant/join/${invite.code}`)}
                                className="mt-3 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                            >
                                Join this Unit
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-600">No pending invitations found.</p>
            )}
        </div>
    );
}
