"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ChatInquiry from "../chatInquiry";
import useAuth from "../../../hooks/useSession";
import {
  FaCalendarAlt,
  FaClock,
  FaHome,
  FaFileContract,
  FaEye,
  FaPaperPlane,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";

const customCalendarStyles = `
  .react-calendar {
    width: 100% !important;
    max-width: 100% !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
    font-family: inherit !important;
    background: white !important;
  }
  
  .react-calendar__navigation {
    height: 44px !important;
    margin-bottom: 1em !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 0 1rem !important;
  }
  
  .react-calendar__navigation button {
    min-width: 44px !important;
    background: none !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    color: #374151 !important;
    border: none !important;
    cursor: pointer !important;
    padding: 0.5rem !important;
    border-radius: 0.375rem !important;
  }
  
  .react-calendar__navigation button:hover {
    background-color: #f3f4f6 !important;
  }
  
  .react-calendar__navigation button:disabled {
    background-color: #f9fafb !important;
    opacity: 0.6 !important;
    cursor: not-allowed !important;
  }
  
  .react-calendar__month-view__weekdays {
    text-align: center !important;
    text-transform: uppercase !important;
    font-weight: 600 !important;
    font-size: 0.75rem !important;
    color: #6b7280 !important;
    margin-bottom: 0.5rem !important;
  }
  
  .react-calendar__month-view__weekdays__weekday {
    padding: 0.5rem 0.25rem !important;
    text-align: center !important;
  }
  
  .react-calendar__month-view__days {
    display: grid !important;
    grid-template-columns: repeat(7, 1fr) !important;
    gap: 2px !important;
  }
  
  .react-calendar__tile {
    max-width: 100% !important;
    height: 40px !important;
    padding: 0 !important;
    background: none !important;
    text-align: center !important;
    line-height: 40px !important;
    font-size: 0.875rem !important;
    border-radius: 0.375rem !important;
    border: none !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    position: relative !important;
  }
  
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: #dbeafe !important;
    color: #1d4ed8 !important;
  }
  
  .react-calendar__tile--now {
    background: #fef3c7 !important;
    color: #92400e !important;
    font-weight: 600 !important;
  }
  
  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background: #fde68a !important;
    color: #78350f !important;
  }
  
  .react-calendar__tile--hasActive {
    background: #3b82f6 !important;
    color: white !important;
    font-weight: 600 !important;
  }
  
  .react-calendar__tile--hasActive:enabled:hover,
  .react-calendar__tile--hasActive:enabled:focus {
    background: #2563eb !important;
  }
  
  .react-calendar__tile--active {
    background: #3b82f6 !important;
    color: white !important;
    font-weight: 600 !important;
  }
  
  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: #2563eb !important;
  }
  
  .react-calendar__tile--disabled {
    background-color: #f9fafb !important;
    color: #d1d5db !important;
    cursor: not-allowed !important;
    opacity: 0.6 !important;
  }
  
  .react-calendar__month-view__days__day--weekend {
    color: #dc2626 !important;
  }
  
  .react-calendar__month-view__days__day--neighboringMonth {
    color: #9ca3af !important;
    opacity: 0.6 !important;
  }
  
  /* Ensure proper alignment and spacing */
  .react-calendar__viewContainer {
    padding: 1rem !important;
  }
  
  .react-calendar__month-view {
    padding: 0 !important;
  }
`;

export default function InquiryBooking({
  tenant_id,
  unit_id,
  rent_amount,
  landlord_id,
}) {
  const [view, setView] = useState("inquire");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedDates, setBookedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch booked dates when the component mounts
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const response = await axios.get("/api/tenant/visits/booked-dates");
        setBookedDates(response.data.bookedDates);
      } catch (error) {
        console.error("Error fetching booked dates:", error);
      }
    };

    fetchBookedDates();
  }, []);

  const isTileDisabled = ({ date, view }) => {
    if (view !== "month") return false;

    const formattedDate = date.toISOString().split("T")[0];
    const bookingInfo = bookedDates[formattedDate];

    // Disable date if it has 1 or more bookings or if it's in the past
    return (bookingInfo && bookingInfo.count >= 1) || date < new Date();
  };

  const handleTimeChange = (e) => {
    const selected = e.target.value;
    const [hours] = selected.split(":").map(Number);

    if (hours < 8 || hours > 20) {
      Swal.fire({
        icon: "error",
        title: "Invalid Time",
        text: "Please select a time between 8 AM and 8 PM.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    setSelectedTime(selected);
  };

  const getCombinedDateTime = () => {
    if (!selectedDate || !selectedTime) return null;

    const [hours, minutes] = selectedTime.split(":");
    const updatedDate = new Date(selectedDate);
    updatedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    return updatedDate.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  // For Tenant only seeking to visit property not applying yet.
  const handleJustSchedule = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      Swal.fire({
        icon: "error",
        title: "Incomplete Selection",
        text: "Please select both date and time.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "/api/tenant/property-finder/schedVisitOnly",
        {
          tenant_id,
          unit_id,
          visit_date: selectedDate.toISOString().split("T")[0],
          visit_time: `${selectedTime}:00`,
        }
      );

      if (response.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Visit Scheduled",
          text: "Visit scheduled successfully!",
          confirmButtonColor: "#3085d6",
        });
        router.push("/pages/find-rent");
      }
    } catch (error) {
      console.error("Error scheduling visit:", error);
      await Swal.fire({
        icon: "error",
        title: "Scheduling Error",
        text: "Failed to schedule visit. Please try again.",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setLoading(false);
    }
  };

  // For direct application without scheduling
  const handleApplyNow = () => {
    router.push(
      unit_id ? `/pages/tenant/prospective/${unit_id}` : "/pages/find-rent"
    );
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Custom Calendar Styles */}
      <style>{customCalendarStyles}</style>

      {/* Header with Price */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
        <div className="text-center">
          <p className="text-blue-100 text-sm font-medium mb-1">Monthly Rent</p>
          <p className="text-3xl font-bold">₱{rent_amount?.toLocaleString()}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        <button
          className={`flex-1 py-4 px-4 font-semibold text-sm transition-all duration-200 ${
            view === "inquire"
              ? "bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
          onClick={() => setView("inquire")}
        >
          <FaPaperPlane className="inline mr-2 text-sm" />
          Ask Questions
        </button>
        <button
          className={`flex-1 py-4 px-4 font-semibold text-sm transition-all duration-200 ${
            view === "schedule"
              ? "bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
          onClick={() => setView("schedule")}
        >
          <FaCalendarAlt className="inline mr-2 text-sm" />
          Schedule Visit
        </button>
        <button
          className={`flex-1 py-4 px-4 font-semibold text-sm transition-all duration-200 ${
            view === "apply"
              ? "bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
          onClick={() => setView("apply")}
        >
          <FaFileContract className="inline mr-2 text-sm" />
          Apply Now
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {view === "inquire" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Have Questions?
              </h3>
              <p className="text-sm text-gray-600">
                Get in touch with the landlord directly
              </p>
            </div>
            <ChatInquiry landlord_id={landlord_id} />
          </div>
        )}

        {view === "schedule" && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <FaEye className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Schedule a Visit
              </h3>
              <p className="text-sm text-gray-600">
                Book a time to view this property in person
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileDisabled={isTileDisabled}
                className="w-full custom-calendar"
                minDetail="month"
                minDate={new Date()}
              />
            </div>

            {selectedDate && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FaClock className="inline mr-2 text-blue-500" />
                  Select Time (8 AM - 8 PM):
                </label>

                <select
                  value={selectedTime}
                  onChange={handleTimeChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                >
                  <option value="">Choose a time slot</option>
                  {Array.from({ length: 25 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 8;
                    const minute = i % 2 === 0 ? "00" : "30";
                    if (hour > 20) return null;
                    const time = `${hour
                      .toString()
                      .padStart(2, "0")}:${minute}`;
                    const displayTime = new Date(
                      `2024-01-01T${time}`
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                    return (
                      <option key={time} value={time}>
                        {displayTime}
                      </option>
                    );
                  }).filter(Boolean)}
                </select>

                {selectedTime && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <FaCheckCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Visit Scheduled For:
                        </p>
                        <p className="text-sm text-blue-700">
                          {getCombinedDateTime()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              className={`w-full py-3 rounded-lg transition-all duration-200 text-base font-semibold ${
                selectedDate && selectedTime
                  ? "bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!selectedDate || !selectedTime || loading}
              onClick={handleJustSchedule}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </div>
              ) : (
                <>
                  <FaCalendarAlt className="inline mr-2" />
                  Schedule Visit
                </>
              )}
            </button>
          </div>
        )}

        {view === "apply" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FaHome className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Apply for This Unit
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ready to make this your new home? Start your rental application
                now and get priority consideration.
              </p>
            </div>

            <div className="bg-green-50 rounded-xl p-5 border border-green-200 mb-6">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                <FaCheckCircle className="mr-2" />
                What happens next?
              </h4>
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>Complete your detailed rental application</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>Upload required documents and references</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>Get priority review from the landlord</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>Schedule a visit if approved</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">
                Application Requirements
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Valid government-issued ID</p>
                <p>• Your Occupation</p>
                <p>• Your Monthly Income Range</p>
                <p>• Address</p>
              </div>
            </div>

            <button
              className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold text-base hover:bg-green-700 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
              onClick={handleApplyNow}
            >
              <FaFileContract className="mr-2" />
              Start Application
              <FaArrowRight className="ml-2" />
            </button>

            <p className="text-xs text-gray-500 text-center leading-relaxed">
              By applying, you agree to provide accurate information and
              understand that false information may result in application
              rejection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
