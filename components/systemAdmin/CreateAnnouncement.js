    "use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAnnouncementStore from "../../zustand/annoucementAdminStore"; 

export default function CreateAnnouncement() {
    const router = useRouter();
    const pathname = usePathname();

    const { title, message, targetAudience, setTitle, setMessage, setTargetAudience, resetForm } =
        useAnnouncementStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (title || message || targetAudience) {
            setIsDirty(true);
        }

        const handleBeforeUnload = (event) => {
            if (isDirty) {
                event.preventDefault();
                event.returnValue = "You have unsaved changes. Do you really want to leave?";
            }
        };

        const handlePopState = () => {
            if (isDirty && !window.confirm("You have unsaved changes. Do you really want to leave?")) {
                router.replace(pathname);
            } else {
                resetForm();
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [title, message, targetAudience, isDirty, router, pathname, resetForm]);

    useEffect(() => {
        const handleRouteChange = () => {
            if (isDirty && !window.confirm("You have unsaved changes. Do you really want to leave?")) {
                throw "Navigation prevented";
            } else {
                resetForm();
            }
        };

        router.events?.on("routeChangeStart", handleRouteChange);

        return () => {
            router.events?.off("routeChangeStart", handleRouteChange);
        };
    }, [isDirty, router, resetForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/systemadmin/annoucement/annoucement", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title, message, target_audience: targetAudience }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSuccess("Announcement created successfully!");
            resetForm();
            setIsDirty(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex">
            
            <div className="flex-1 p-6 max-w-6xl mx-auto">
                <h1 className="text-2xl font-semibold text-blue-600 mb-6">Create Announcement</h1>
                
                <div className="bg-white rounded-lg shadow overflow-hidden p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                            {success}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                                rows="6"
                                required
                            ></textarea>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                            <select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                                required
                            >
                                <option value="all">All</option>
                                <option value="tenant">Tenants</option>
                                <option value="landlord">Landlords</option>
                            </select>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex-1"
                            >
                                {loading ? "Creating..." : "Create Announcement"}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition flex-1"
                            >
                                Discard Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
