"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

// @ts-ignore
const PropertyDocumentsTab = ({ propertyId }) => {
    const [docsData, setDocsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!propertyId) return;

        const fetchDocuments = async () => {
            try {
                const response = await axios.get(`/api/landlord/properties/docs/${propertyId}`);
                setDocsData(response.data || null);
            } catch (err) {
                console.error("Failed to fetch documents:", err);
                setDocsData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [propertyId]);

    if (loading) {
        return <p className="text-gray-500 text-sm">Loading documents...</p>;
    }

    if (!docsData) {
        return (
            <div className="text-center text-gray-500 text-sm py-4">
                No documents or permits uploaded for this property.
            </div>
        );
    }

    const renderField = (label: string, path: string | null | undefined) => (
        <div className="flex justify-between items-center border p-3 rounded shadow-sm">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-500">{path || "Not uploaded"}</p>
            </div>
            {path ? (
                <a
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                >
                    View
                </a>
            ) : (
                <span className="text-gray-400 italic">N/A</span>
            )}
        </div>
    );

    // @ts-ignore
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Property Documents</h2>

            {renderField("Occupancy Permit", docsData.occ_permit)}
            {renderField("Mayor's Permit", docsData.mayor_permit)}
            {renderField("Property Title", docsData.property_title)}

            <hr className="my-6" />
        </div>
    );
};

export default PropertyDocumentsTab;
