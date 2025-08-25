"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ label = "Back" }: { label?: string }) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700
                 bg-gray-100 border border-gray-300 rounded-lg shadow-sm
                 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {label}
        </button>
    );
}
