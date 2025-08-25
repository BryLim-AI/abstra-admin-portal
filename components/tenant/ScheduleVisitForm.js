import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

export default function ScheduleVisitForm({ tenant_id, property_id, unit_id }) {
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDateChange = (e) => {
    setVisitDate(e.target.value);
  };

  const handleTimeChange = (e) => {
    setVisitTime(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!visitDate || !visitTime) {
      setError("Please select both date and time.");
      return;
    }

    try {
      setLoading(true);

      // Format the visit_time to include seconds (if not already)
      const formattedTime = visitTime.includes(":")
        ? `${visitTime}:00`
        : visitTime;

      console.log({
        tenant_id,
        property_id,
        unit_id,
        visit_date: visitDate,
        visit_time: formattedTime.toString(),
      });

      const response = await axios.post("/api/tenant/visits/schedule-visit", {
        tenant_id,
        property_id,
        unit_id,
        visit_date: visitDate,
        visit_time: visitTime,
      });

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Visit scheduled successfully!",
        }).then(() => {
          router.push(`/pages/find-rent/${property_id}`);
        });
      }
    } catch (error) {
      console.error("Error scheduling visit:", error);
      setError("Failed to schedule visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Schedule a Visit</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="visitDate"
            className="block text-sm font-medium text-gray-700"
          >
            Visit Date
          </label>
          <input
            id="visitDate"
            name="visitDate"
            type="date"
            value={visitDate}
            onChange={handleDateChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="visitTime"
            className="block text-sm font-medium text-gray-700"
          >
            Visit Time
          </label>
          <input
            id="visitTime"
            name="visitTime"
            type="time"
            value={visitTime}
            onChange={handleTimeChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm ${
            loading ? "opacity-50" : "hover:bg-indigo-700"
          }`}
        >
          {loading ? "Scheduling..." : "Schedule Visit"}
        </button>
      </form>
    </div>
  );
}
