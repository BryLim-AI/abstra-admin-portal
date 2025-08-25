"use client";
import { useState, useEffect } from "react";
import useEditPropertyStore from "../../../../zustand/property/useEditPropertyStore";
import { FaImage, FaInfoCircle } from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { UTILITY_BILLING_TYPES } from "../../../../constant/utilityBillingType";
import { PROPERTY_PREFERENCES } from "../../../../constant/propertyPreferences";

// @ts-ignore
export function StepThreeEdit({ propertyId }) {
    // @ts-ignore
    const { property, photos, setProperty, setPhotos } = useEditPropertyStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch existing photos from server
    useEffect(() => {
        const fetchPhotos = async () => {
            if (!propertyId) return;
            try {
                const { data } = await axios.get(`/api/propertyListing/propertyPhotos?property_id=${propertyId}`);

                // Map API response to format
                const serverPhotos = data.map((photo: any) => ({
                    file: null,
                    preview: photo.photo_url,
                    photo_id: photo.photo_id,
                    isNew: false,
                }));

                // Merge server photos with already added local photos (isNew = true)
                const localNewPhotos = photos.filter((p) => p.isNew);
                setPhotos([...serverPhotos, ...localNewPhotos]);
            } catch (error) {
                console.error("Error fetching photos:", error);
            }
        };
        fetchPhotos();
    }, [propertyId]);


    // Dropzone for new images
    const onDrop = (acceptedFiles: File[]) => {
        const newPhotos = acceptedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            photo_id: null,
            isNew: true,
        }));
        setPhotos([...photos, ...newPhotos]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: "image/*",
        multiple: true,
    });

    // Remove image (existing or new)
    const removeImage = async (index: number) => {
        const photo = photos[index];

        // Delete from server only if existing
        if (photo.photo_id && !photo.isNew) {
            try {
                await axios.delete("/api/propertyListing/deletPropertyPhotos", {
                    data: {
                        photo_id: photo.photo_id,
                        property_id: propertyId,
                    },
                });
            } catch (error) {
                console.error("Failed to delete photo from server:", error);
                alert("Failed to delete photo from server.");
                return;
            }
        }

        // Remove locally
        setPhotos(photos.filter((_, i) => i !== index));
    };

    // Handle input changes
    const handleChange = (e: any) => {
        const { name, type, checked, value } = e.target;
        const newValue = type === "checkbox" ? (checked ? 1 : 0) : value;
        setProperty({ ...property, [name]: newValue });
    };

    // Toggle property preferences
    const togglePreference = (key: string) => {
        const current = property.propertyPreferences || [];
        setProperty({
            ...property,
            propertyPreferences: current.includes(key)
                ? current.filter((item: string) => item !== key)
                : [...current, key],
        });
    };

    // AI description generation
    const handleGenerateDescription = async () => {
        setLoading(true);
        const { propertyName, propertyType, amenities, street, brgyDistrict, city, zipCode, province } = property;
        const prompt = `Generate a compelling property description for a listing with the following details:
- Name: ${propertyName}
- Type: ${propertyType}
- Amenities: ${amenities?.join(", ") || "None"}
- Location: ${street}, ${brgyDistrict}, ${city}, ${zipCode}, ${province}
Make it sound appealing, ideal for renters, and professional in tone.`;

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-r1:free",
                    messages: [
                        { role: "system", content: "You are a helpful real estate assistant." },
                        { role: "user", content: prompt },
                    ],
                }),
            });
            const data = await response.json();
            const aiText = data?.choices?.[0]?.message?.content?.trim();
            if (aiText) setProperty({ ...property, propDesc: aiText });
        } catch (error) {
            console.error("AI generation error:", error);
            alert("Failed to generate description. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Property Details */}
            <div className="p-6 border rounded-md shadow-md">
                <h2 className="text-2xl font-bold mb-2">Edit Property Details</h2>
                <p className="text-gray-500 mb-4">Update your property details. You can always make changes later.</p>

                <div className="space-y-4">
                    {/* Description */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Description</label>
                        <textarea
                            name="propDesc"
                            value={property.propDesc || ""}
                            onChange={handleChange}
                            placeholder="Add a brief description of the property"
                            className="w-full p-2 border rounded"
                            maxLength={500}
                            rows={5}
                        />
                        <button
                            type="button"
                            onClick={handleGenerateDescription}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            {loading ? "Generating..." : "✨ Generate with AI"}
                        </button>
                    </div>

                    {/* Floor Area */}
                    <div className="flex items-center space-x-2">
                        <div className="flex-grow">
                            <label className="block text-gray-700 font-medium mb-1">Total Property Size (sqm)</label>
                            <input
                                type="number"
                                name="floorArea"
                                value={property.floorArea || ""}
                                onChange={handleChange}
                                placeholder="e.g., 50"
                                min={0}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <span className="text-gray-500">sqm</span>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-2">
                        <label className="block text-gray-700 font-medium mb-1">Property Preferences / Rules</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PROPERTY_PREFERENCES.map((pref) => {
                                const Icon = pref.icon;
                                const isSelected = (property.propertyPreferences || []).includes(pref.key);
                                return (
                                    <button
                                        key={pref.key}
                                        type="button"
                                        onClick={() => togglePreference(pref.key)}
                                        className={`flex flex-col items-center justify-center p-4 border rounded-lg shadow-sm text-sm transition ${
                                            isSelected
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "bg-white text-gray-700 border-gray-300"
                                        } hover:border-blue-400 hover:bg-blue-50`}
                                    >
                                        <Icon className="text-2xl mb-1" />
                                        {pref.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Utility Billing Type */}
                    <div>
                        <label className="text-gray-700 font-medium flex items-center space-x-2 mt-4">
                            <span>Utility Billing Type</span>
                            <FaInfoCircle className="text-blue-600 text-lg cursor-pointer" onClick={() => setIsModalOpen(true)} />
                        </label>
                        <select
                            name="utilityBillingType"
                            value={property.utilityBillingType || ""}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="" disabled>Select a billing type</option>
                            {UTILITY_BILLING_TYPES.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>

                        {isModalOpen && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
                                    <h3 className="text-lg font-semibold mb-4">Utility Billing Types</h3>
                                    <ul className="space-y-2 text-gray-700">
                                        <li><strong>Included:</strong> Rent covers electricity, water, and utilities.</li>
                                        <li><strong>Provider:</strong> Tenants pay their providers directly.</li>
                                        <li><strong>Submetered:</strong> Billed based on usage.</li>
                                    </ul>
                                    <button onClick={() => setIsModalOpen(false)} className="mt-4 w-full bg-blue-500 text-white p-2 rounded-lg">Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Property Photos */}
            <div className="p-6 border rounded-md shadow-md">
                <h2 className="text-2xl font-bold mb-2">Property Photos</h2>
                <p className="text-gray-500 mb-4">You can update or add photos of your place.</p>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed p-6 rounded-md text-center ${isDragActive ? "border-blue-500" : "border-gray-300"} cursor-pointer`}
                >
                    <input {...getInputProps()} />
                    <FaImage className="text-blue-500 text-4xl mx-auto mb-2" />
                    <p className="font-medium text-gray-700">Drag & drop images here</p>
                </div>

                {photos?.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {photos.map((photo, index) => (
                            <div key={index} className="relative">
                                <img src={photo.preview} alt="preview" className="w-full h-32 object-cover rounded-md" />
                                <span
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs cursor-pointer"
                                    onClick={() => removeImage(index)}
                                >
                                    X
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
