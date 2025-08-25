import { useState } from "react";

const LandlordFeedbackForm = ({ review_id, landlord_id, onFeedbackSubmit }) => {
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setError("Feedback cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reviews/submitFeedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landlord_id,
          review_id,
          feedback_text: feedbackText,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        onFeedbackSubmit(data);
        setFeedbackText("");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to submit feedback.");
    }

    setLoading(false);
  };

  return (
    <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-700">Reply to Review:</h4>
      <form onSubmit={handleSubmit} className="mt-2">
        <textarea
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Write your feedback..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        ></textarea>

        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

        <button
          type="submit"
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
};

export default LandlordFeedbackForm;
