import { useEffect, useState } from "react";
import axios from "axios";

interface LeaseAgreement {
  agreement_id: number;
  start_date: string;
  end_date: string;
  duration: number;
  status: "active" | "inactive" | string;
}

interface LeaseDurationTrackerProps {
  agreement_id: number;
}

export default function LeaseDurationTracker({ agreement_id }: LeaseDurationTrackerProps) {
  const [lease, setLease] = useState<LeaseAgreement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLease() {
      try {
        const response = await axios.get<{ lease: LeaseAgreement[] }>(
            `/api/tenant/dashboard/getLeaseWidget?agreement_id=${agreement_id}`
        );
        // @ts-ignore
        setLease(response.data.lease[0]); // first item in array
      } catch (err: any) {
        console.error("Error fetching lease:", err);
        setError(err.response?.data?.message || "Failed to fetch lease agreement.");
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) fetchLease();
  }, [agreement_id]);

  if (loading) return <p>Loading lease details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!lease) return <p>No active lease agreement found.</p>;

  const start = new Date(lease.start_date);
  const end = new Date(lease.end_date);
  const today = new Date();

  const totalDays = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 1);
  const elapsedDays = Math.min(Math.max((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0), totalDays);
  const remainingDays = Math.max(totalDays - elapsedDays, 0);
  const progressPercent = (elapsedDays / totalDays) * 100;

  return (
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Lease Duration Tracker</h2>

        {/* Remaining Days Text */}
        <div className="text-right mb-2 text-gray-700">
          <span className="text-lg font-bold">{Math.floor(elapsedDays)}</span> of <span className="text-gray-600">{Math.ceil(totalDays)}</span> days completed, <span className="text-red-600 font-medium">{Math.ceil(remainingDays)}</span> days remaining
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
              className={`h-4 rounded-full transition-all duration-500 ${
                  remainingDays <= 7 ? "bg-red-600" : remainingDays <= totalDays / 2 ? "bg-yellow-500" : "bg-blue-600"
              }`}
              style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
  );
}
