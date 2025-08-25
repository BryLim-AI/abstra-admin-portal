import { useState } from "react";

const FeedbackForm = ({ landlord_id, review_id, onFeedbackSubmitted }) => {
  const [feedbackText, setFeedbackText] = useState("");

  const submitFeedback = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/reviews/submitFeedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landlord_id,
        review_id,
        feedback_text: feedbackText,
      }),
    });

    if (res.ok) {
      onFeedbackSubmitted();
      setFeedbackText("");
    }
  };

  return (
    <form onSubmit={submitFeedback} className="p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold">Leave Feedback</h3>
      <textarea
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        className="w-full border p-2 rounded"
        placeholder="Write your feedback..."
      />
      <button
        type="submit"
        className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
      >
        Submit Feedback
      </button>
    </form>
  );
};

export default FeedbackForm;
