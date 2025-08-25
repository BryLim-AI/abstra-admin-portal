import { useRouter } from "next/navigation";
import { useState } from "react";

const ReviewForm = ({ tenant_id, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const router = useRouter();

  const submitReview = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/reviews/submitReview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id,
        rating,
        review_text: reviewText,
      }),
    });

    if (res.ok) {
      onReviewSubmitted();
      setRating(0);
      setReviewText("");
      router.push("/pages/tenant/dashboard");
    }
  };

  return (
    <form onSubmit={submitReview} className="bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Submit a Review</h1>

      {/* Star Rating */}
      <div className="flex justify-center space-x-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-3xl transition-all ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => setRating(star)}
          >
            ★
          </button>
        ))}
      </div>

      {/* Review Textarea */}
      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Write your review..."
        rows="4"
      />

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg mt-4 transition-all"
      >
        Submit Review
      </button>
    </form>
  );
};

export default ReviewForm;
