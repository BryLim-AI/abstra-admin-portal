import { useEffect, useState } from "react";

// @ts-ignore
export default function UpcomingVisitsWidget({ landlordId }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!landlordId) return;

        async function fetchVisits() {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/landlord/propertyVisits/${landlordId}/upcoming-visits`);
                if (!res.ok) throw new Error("Failed to fetch visits");
                const data = await res.json();
                setVisits(data);
            } catch (err) {
                // @ts-ignore
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchVisits();
    }, [landlordId]);

    if (loading) return <div>Loading upcoming visits...</div>;
    if (error) return <div className="text-red-600">Error: {error}</div>;

    // @ts-ignore
    return (
        <div className="bg-white shadow rounded p-4 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upcoming Property Visits</h3>

            {visits.length === 0 ? (
                <p className="italic text-gray-500">No upcoming visits.</p>
            ) : (
                <ul className="space-y-3">
                    {visits.map((visit) => (
                        <li key={visit?.visit_id} className="border-b pb-2 last:border-b-0">
                            <div className="font-semibold">{visit?.property_name} - {visit?.unit_name}</div>
                            <div>
                                Tenant: <span className="italic">{visit?.tenant_name}</span>
                            </div>
                            <div>
                                Date: {new Date(visit?.visit_date).toLocaleDateString()}{" "}
                                at {visit?.visit_time?.slice(0, 5) /* hh:mm */}
                            </div>
                            <div>
                                Status: <span className="capitalize">{visit.status}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
