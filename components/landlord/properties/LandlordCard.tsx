import React from "react";
import { FaUserTie, FaPhoneAlt, FaEnvelope } from "react-icons/fa";

export default function LandlordCard({ landlord }) {
    if (!landlord) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 pl-12 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <FaUserTie className="mr-2 text-purple-500" />
                Landlord Details
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center">
                    {landlord.photoUrl && (
                        <img
                            src={landlord.photoUrl}
                            alt={landlord.name}
                            className="w-16 h-16 rounded-full mr-4"
                        />
                    )}
                    <div>
                        <p className="text-lg font-semibold text-gray-800">
                            {landlord.name}
                        </p>
                        {landlord.company && (
                            <p className="text-sm text-gray-500">{landlord.company}</p>
                        )}
                    </div>
                </div>

                <div className="mt-4 sm:mt-0 flex flex-col gap-2">
                    {landlord.phone && (
                        <div className="flex items-center text-gray-700">
                            <FaPhoneAlt className="mr-2 text-green-500" />
                            <a href={`tel:${landlord.phone}`} className="hover:underline">
                                {landlord.phone}
                            </a>
                        </div>
                    )}
                    {landlord.email && (
                        <div className="flex items-center text-gray-700">
                            <FaEnvelope className="mr-2 text-blue-500" />
                            <a href={`mailto:${landlord.email}`} className="hover:underline">
                                {landlord.email}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
