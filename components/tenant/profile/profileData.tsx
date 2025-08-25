"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import occupations from "@/constant/occupations";
import employmentTypes from "@/constant/employementType";
import monthlyIncomeRanges from "@/constant/monthlyIncome";

interface Tenant {
    address: string;
    occupation: string;
    employment_type: string;
    monthly_income: string;
}

interface TenantDetailsProps {
    userId: string;
}

export default function TenantDetails({ userId }: TenantDetailsProps) {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    // @ts-ignore
    const [formData, setFormData] = useState<Tenant>({ ...tenant });

    useEffect(() => {
        // @ts-ignore
        setFormData({ ...tenant });
    }, [tenant]);

    useEffect(() => {
        if (!userId) return;

        axios
            .get(`/api/tenant/myProfileDetails?user_id=${userId}`)
            .then((res) => setTenant(res.data))
            .catch((err) => {
                console.error("Failed to fetch tenant details:", err);
                setTenant(null);
            })
            .finally(() => setLoading(false));
    }, [userId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!tenant) return;

        try {
            const payload = {
                user_id: userId,
                address: formData.address,
                occupation: formData.occupation,
                employment_type: formData.employment_type,
                monthly_income: formData.monthly_income,
            };

            const response = await fetch("/api/tenant/myProfileDetails/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // update tenant state with saved values
                setTenant((prev) => (prev ? { ...prev, ...formData } : prev));
                setEditing(false);
                console.log("Tenant details saved:", data);
            } else {
                console.error("Save failed:", data);
                alert("Failed to save tenant details. Please try again.");
            }
        } catch (err) {
            console.error("Error saving tenant details:", err);
            alert("Error saving tenant details. Please try again.");
        }
    };



    if (loading) return <p>Loading tenant details...</p>;
    if (!tenant) return <p>No tenant details found.</p>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 max-w-4xl mx-auto relative">
            {/* Section Header with Edit/Save Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Tenant Details</h2>
                {editing ? (
                    <button
                        className="text-sm text-green-600 font-medium hover:text-green-800 transition-colors"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                ) : (
                    <button
                        className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors"
                        onClick={() => setEditing(true)}
                    >
                        Edit
                    </button>
                )}
            </div>

            {/* Personal Information */}
            <h3 className="text-xs font-semibold text-gray-500 mb-2">Other Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <p className="text-sm text-gray-500">Address</p>
                    {editing ? (
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                    ) : (
                        <p className="text-gray-700 font-medium">{tenant.address}</p>
                    )}
                </div>
            </div>

            {/* Employment Information */}
            <h3 className="text-xs font-semibold text-gray-500 mb-2">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-500">Occupation</p>
                    {editing ? (
                        <select
                            name="occupation"
                            value={formData.occupation}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            {occupations.map((occ) => (
                                <option key={occ.value} value={occ.value}>
                                    {occ.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-gray-700 font-medium">
                            {occupations.find((occ) => occ.value === tenant.occupation)?.label || tenant.occupation}
                        </p>
                    )}
                </div>
                <div>
                    <p className="text-sm text-gray-500">Employment Type</p>
                    {editing ? (
                        <select
                            name="employment_type"
                            value={formData.employment_type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            {employmentTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-gray-700 font-medium">
                            {employmentTypes.find((type) => type.value === tenant.employment_type)?.label ||
                                tenant.employment_type}
                        </p>
                    )}
                </div>
                <div>
                    <p className="text-sm text-gray-500">Monthly Income</p>
                    {editing ? (
                        <select
                            name="monthly_income"
                            value={formData.monthly_income}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            {monthlyIncomeRanges.map((range) => (
                                <option key={range.value} value={range.value}>
                                    {range.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-gray-700 font-medium">
                            {monthlyIncomeRanges.find((range) => range.value === tenant.monthly_income)?.label ||
                                tenant.monthly_income}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

}
