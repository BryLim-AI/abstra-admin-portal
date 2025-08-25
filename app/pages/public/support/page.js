'use client'

import { useState } from "react";
import Swal from "sweetalert2";

const ISSUES = [
    "Billing & Payments",
    "Account Access Issues",
    "Property Listing Problems",
    "Tenant/Landlord Disputes",
    "Technical Issues",
    "Other"
];

export default function ContactSupport() {
    const [email, setEmail] = useState("");
    const [selectedIssue, setSelectedIssue] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !isValidEmail(email)) {
            Swal.fire({
                title: "Invalid Email",
                text: "Please enter a valid email address.",
                icon: "error",
                confirmButtonText: "OK",
            });
            return;
        }

        if (!selectedIssue || !message.trim()) {
            Swal.fire({
                title: "Error",
                text: "Please select an issue and describe your problem.",
                icon: "error",
                confirmButtonText: "OK",
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/support/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, selectedIssue, message }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit request.");
            }

            Swal.fire({
                title: "Support Request Sent",
                text: "Our support team will contact you soon via email.",
                icon: "success",
                confirmButtonText: "OK",
            });

            // Reset form
            setEmail("");
            setSelectedIssue("");
            setMessage("");

        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error.message,
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Support</h2>
            <form onSubmit={handleSubmit}>
                {/* Email Input */}
                <label className="block text-gray-700 font-medium">Your Email:</label>
                <input
                    type="email"
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                />

                {/* Issue Selection */}
                <label className="block text-gray-700 font-medium mt-4">Select an Issue:</label>
                <select
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    value={selectedIssue}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                    required
                >
                    <option value="">-- Choose an Issue --</option>
                    {ISSUES.map((issue, index) => (
                        <option key={index} value={issue}>{issue}</option>
                    ))}
                </select>

                {/* Message Input */}
                <label className="block text-gray-700 font-medium mt-4">Describe Your Problem:</label>
                <textarea
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    rows="4"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details about your issue..."
                    required
                />

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                    disabled={loading}
                >
                    {loading ? "Submitting..." : "Submit Request"}
                </button>
            </form>
        </div>
    );
}
