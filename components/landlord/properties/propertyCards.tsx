"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    BuildingOffice2Icon,
    HomeIcon,
    PencilSquareIcon,
    TrashIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface PropertyCardProps {
    property: any;
    index: number;
    subscription: any;
    handleView: (property: any, event: React.MouseEvent) => void;
    handleEdit: (propertyId: number, event: React.MouseEvent) => void;
    handleDelete: (propertyId: number, event: React.MouseEvent) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
                                                       property,
                                                       index,
                                                       subscription,
                                                       handleView,
                                                       handleEdit,
                                                       handleDelete,
                                                   }) => {
    const router = useRouter();
    const isLocked =
        subscription && index >= (subscription?.listingLimits?.maxProperties || 0);

    return (
        <div
            key={property?.property_id}
            className={`relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-shadow h-full flex flex-col ${
                isLocked ? "opacity-50 pointer-events-none" : "hover:shadow-md"
            }`}
        >
            {isLocked && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex flex-col items-center justify-center text-gray-500 font-semibold">
                    <p className="text-red-600 font-bold">Locked - Upgrade Plan</p>
                    <Link
                        href="/pages/landlord/sub_two/subscription"
                        className="mt-2 text-blue-600 underline text-sm"
                    >
                        Upgrade Subscription
                    </Link>
                </div>
            )}

            {/* Property Image */}
            <div className="h-48">
                {property?.photos.length > 0 ? (
                    <Image
                        src={property?.photos[0]?.photo_url}
                        alt={property?.property_name}
                        width={400}
                        height={250}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <BuildingOffice2Icon className="h-12 w-12 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Property Info */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="mb-2 flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                        {property?.property_name}
                    </h3>
                    <div className="flex items-start text-gray-600 text-sm mb-2">
                        <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                        <p className="line-clamp-2">
                            {property?.street}, {property?.city},{" "}
                            {property?.province
                                .split("_")
                                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(" ")}
                        </p>
                    </div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
            {property?.property_type.charAt(0).toUpperCase() +
                property?.property_type.slice(1)}
          </span>

                    {/* Verification Status */}
                    <div className="flex items-center space-x-2 mt-2">
            <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full 
              ${
                    property?.verification_status === "Verified"
                        ? "bg-green-100 text-green-700"
                        : property?.verification_status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : property?.verification_status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                }`}
            >
              {property?.verification_status || "Not Submitted"}
            </span>

                        {property?.verification_status === "Rejected" &&
                            property.attempts < 4 && (
                                <button
                                    className="px-3 py-1 text-xs font-semibold bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                                    onClick={() =>
                                        router.push(
                                            `/pages/landlord/property-listing/resubmit-verification/${property?.property_id}`
                                        )
                                    }
                                >
                                    Resubmit ({4 - property.attempts} left)
                                </button>
                            )}

                        {property?.verification_status === "Rejected" &&
                            property.attempts >= 4 && (
                                <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-md">
                  Max attempts reached
                </span>
                            )}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex justify-between">
                        <button
                            className="flex items-center px-3 py-2 text-sm rounded-md transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100"
                            onClick={(event) => handleView(property, event)}
                        >
                            <HomeIcon className="h-4 w-4 mr-1" />
                            View Units
                        </button>

                        <div className="flex space-x-2">
                            <button
                                className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                                onClick={
                                    !isLocked
                                        ? (event) => handleEdit(property?.property_id, event)
                                        : undefined
                                }
                                disabled={isLocked}
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                onClick={
                                    !isLocked
                                        ? (event) => handleDelete(property?.property_id, event)
                                        : undefined
                                }
                                disabled={isLocked}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
