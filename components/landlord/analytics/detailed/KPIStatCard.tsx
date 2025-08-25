"use client";

import { ReactNode } from "react";

interface KPIStatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: ReactNode;
}

export function KPIStatCard({ title, value, description, icon }: KPIStatCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col gap-2">
            <div className="flex items-center gap-3">
                {icon && <div className="text-blue-500 text-2xl">{icon}</div>}
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            </div>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
    );
}
