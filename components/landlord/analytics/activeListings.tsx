import { useEffect, useState } from "react";

interface ActiveListingsCardProps {
    landlordId: string;
}

const ActiveListingsCard: React.FC<ActiveListingsCardProps> = ({ landlordId }) => {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveListings = async () => {
            try {
                const res = await fetch(`/api/analytics/landlord/getActiveListings?landlord_id=${landlordId}`);
                if (!res.ok) throw new Error("Failed to fetch active listings");

                const data = await res.json();
                setCount(data.totalActiveListings);
            } catch (err) {
                console.error(err);
                setCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveListings();
    }, [landlordId]);

    return (
        <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-lg shadow-sm">
            <p className="text-sm font-medium text-gray-600">Total Active Listings</p>
            <p className="text-2xl font-bold text-blue-700">
                {loading ? "Loading..." : count}
            </p>
        </div>
    );
};

export default ActiveListingsCard;
