"use client";

import useAuthStore from "@/zustand/authStore";

export default function InfoPage() {
    const { user } = useAuthStore();

    if (!user) return <div className="p-6">Loading...</div>;

    return (
        <div className="page h-full w-full bg-white p-6 text-gray-800 font-serif flex flex-col justify-between">
            <div>
                <h2 className="text-2xl font-bold text-center mb-4">Tenant Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-semibold">Full Name:</p>
                        <p className="text-base">{user.full_name}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Tenant ID:</p>
                        <p className="text-base">{user.tenant_id}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Email:</p>
                        <p className="text-base">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Contact Number:</p>
                        <p className="text-base">{user.contact_number || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Date Joined:</p>
                        <p className="text-base">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Status:</p>
                        <p className="text-base">{user.status || "Active"}</p>
                    </div>
                </div>
            </div>
            <div className="text-center text-xs text-gray-400 mt-8">
                Issued by Hestia Rental Management System
            </div>
        </div>
    );
}
