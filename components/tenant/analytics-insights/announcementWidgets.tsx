"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Announcement {
    announcement_id: number;
    subject: string;
    description: string;
    created_at: string;
}

interface AnnouncementWidgetProps {
    agreement_id: number;
}

export default function AnnouncementWidget({ agreement_id }: AnnouncementWidgetProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAnnouncements() {
            try {
                const response = await axios.get<{ announcements: Announcement[] }>(
                    `/api/tenant/announcement/getAnnouncementPerProperty?agreement_id=${agreement_id}`
                );
                setAnnouncements(response.data.announcements);
            } catch (err: any) {
                console.error("Error fetching announcements:", err);
                setError(err.response?.data?.message || "Failed to fetch announcements.");
            } finally {
                setLoading(false);
            }
        }

        if (agreement_id) fetchAnnouncements();
    }, [agreement_id]);

    if (loading) return <p>Loading announcements...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!announcements.length) return <p>No announcements available.</p>;

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 overflow-y-auto max-h-96">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Announcements</h2>
            <ul className="space-y-4">
                {announcements.map((a) => (
                    <li
                        key={a.announcement_id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                        <h3 className="font-medium text-gray-800">{a.subject}</h3>
                        <p className="text-gray-600 text-sm mt-1">{a.description}</p>
                        <p className="text-gray-400 text-xs mt-1">
                            {new Date(a.created_at).toLocaleDateString()}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
