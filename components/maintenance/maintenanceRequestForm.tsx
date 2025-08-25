"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import useAuth from "../../hooks/useSession";
import { useRouter, useSearchParams } from "next/navigation";
import TenantLayout from "../../components/navigation/sidebar-tenant";
import { MAINTENANCE_CATEGORIES } from "../../constant/maintenanceCategories";
import Swal from "sweetalert2";
import { z } from "zod";
import { io } from "socket.io-client";
import useAuthStore from "@/zustand/authStore";
import { BackButton } from "../navigation/backButton";

const maintenanceRequestSchema = z.object({
    category: z.string().min(1, "Category is required"),
    subject: z.string().min(1, "Subject is required"),
    description: z.string().min(1, "Description is required"),
    photos: z.array(z.instanceof(File)).min(1, "At least one photo is required"),
});

type ValidationErrors = {
    category?: string;
    subject?: string;
    description?: string;
    photos?: string;
};

export default function MaintenanceRequestForm() {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const agreement_id = searchParams.get("agreement_id");

    const [subject, setSubject] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const socket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
        { autoConnect: true }
    );

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const formData = {
            category: selectedCategory,
            subject,
            description,
            photos,
        };

        const validation = maintenanceRequestSchema.safeParse(formData);

        if (!validation.success) {
            const formattedErrors = validation.error.format();
            setErrors({
                category: formattedErrors.category?._errors[0],
                subject: formattedErrors.subject?._errors[0],
                description: formattedErrors.description?._errors[0],
                photos: formattedErrors.photos?._errors[0],
            });

            Swal.fire({
                icon: "error",
                title: "Validation Error",
                text: "Please fill in all required fields correctly.",
            });

            return;
        }

        Swal.fire({
            title: "Submitting Request...",
            text: "Please wait while we process your maintenance request.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const maintenanceRes = await axios.post("/api/maintenance/createMaintenance", {
                agreement_id,
                subject,
                description,
                category: selectedCategory,
            });

            const requestId = maintenanceRes.data.request_id;

            if (photos.length > 0) {
                const photoForm = new FormData();
                photoForm.append("request_id", requestId);

                photos.forEach((photo) => {
                    photoForm.append("photos", photo);
                });

                await axios.post("/api/maintenance/createMaintenance/uploadPhotos", photoForm, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            Swal.fire({
                icon: "success",
                title: "Request Submitted",
                text: "Your maintenance request has been submitted successfully!",
                confirmButtonColor: "#3085d6",
            }).then(() => {
                router.push(`/pages/tenant/maintenance?agreement_id=${agreement_id}`);
            });
        } catch (error) {
            console.error("Error submitting maintenance request:", error);
            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: "Something went wrong. Please try again later.",
            });
        }
    };

    return (
        <TenantLayout agreement_id={agreement_id}>
            <BackButton label='Back'></BackButton>

            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-2xl">
                    <h2 className="text-2xl font-semibold text-center mb-4 text-blue-600">
                        Submit Maintenance Request
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-medium">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="" disabled>
                                    Select a category
                                </option>
                                {MAINTENANCE_CATEGORIES.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="text-red-500 text-sm">{errors.category}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                placeholder="Enter subject"
                            />
                            {errors.subject && (
                                <p className="text-red-500 text-sm">{errors.subject}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                rows={4}
                                placeholder="Describe the issue"
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm">{errors.description}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium">Upload Photos</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full p-2 border rounded-lg"
                            />
                            {errors.photos && (
                                <p className="text-red-500 text-sm">{errors.photos}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Submit Request
                        </button>
                    </form>
                </div>
            </div>
        </TenantLayout>
    );
}
