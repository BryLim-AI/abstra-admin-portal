"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Tenant {
    user_id: string;
    firstName: string;
    lastName: string;
    unit_name: string;
    secDepositPaid: boolean;
    advPaymentPaid: boolean;
}

interface Props {
    landlord_id?: number; // optional to avoid undefined errors
}

export const PaidDepositsWidget: React.FC<Props> = ({ landlord_id }) => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!landlord_id) return;

        setLoading(true);
        setError(null);

        const fetchTenants = async () => {
            try {
                const res = await axios.get(`/api/landlord/secAdv/${landlord_id}/payments-secAdv`);
                setTenants(res.data.tenants || []);
            } catch (err: any) {
                console.error(err);
                setError("Failed to fetch tenants.");
            } finally {
                setLoading(false);
            }
        };

        fetchTenants();
    }, [landlord_id]);

    if (!landlord_id) return <div className="p-4 border rounded">Landlord not loaded.</div>;
    if (loading) return <div className="p-4 border rounded">Loading...</div>;
    if (error) return <div className="p-4 border rounded text-red-600">{error}</div>;
    if (!tenants.length) return <div className="p-4 border rounded">No tenants have paid yet.</div>;

    return (
        <div className="p-4 border rounded shadow-sm w-72 bg-white">
            <ul className="space-y-1 max-h-64 overflow-y-auto">
                {tenants.map((t) => (
                    <li key={t.user_id} className="flex justify-between text-sm">
            <span>
              {t.firstName} {t.lastName} - {t.property_name} {t.unit_name}
            </span>

                    </li>
                ))}
            </ul>
        </div>
    );
};
