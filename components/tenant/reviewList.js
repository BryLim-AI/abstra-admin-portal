import { useEffect, useState } from "react";
import LandlordFeedbackForm from "../landlord/LandlordFeedbackForm";
import { MessageCircle, Star, Loader, AlertCircle } from "lucide-react";

const ReviewsList = ({ unit_id, landlord_id }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReview, setExpandedReview] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/getReviews?unit_id=${unit_id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setError("Unable to load reviews. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [unit_id]);

  const handleFeedbackSubmit = async () => {
    await fetchReviews();
  };

  const toggleExpandReview = (reviewId) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  // Get initials function
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`;
  };

  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={16} 
            className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          Tenant Reviews
          {reviews.length > 0 && (
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
              {reviews.length}
            </span>
          )}
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-600">Loading reviews...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="mr-2" size={20} />
          {error}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed border-gray-300">
          <p className="text-gray-500">No reviews yet for this unit.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const isExpanded = expandedReview === review.id;
            const truncated = review.review_text?.length > 150 && !isExpanded;
            
            return (
              <div
                key={review.id}
                className="bg-gray-50 rounded-lg p-5 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center rounded-full">
                      {getInitials(review.tenant_first_name, review.tenant_last_name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.tenant_first_name} {review.tenant_last_name}
                      </p>
                      {renderStarRating(review.rating)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-gray-700">
                    {truncated 
                      ? `${review.review_text.substring(0, 150)}...` 
                      : review.review_text
                    }
                  </p>
                  
                  {review.review_text?.length > 150 && (
                    <button 
                      onClick={() => toggleExpandReview(review.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-1 focus:outline-none"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>

                {review.feedback_text ? (
                  <div className="mt-4 bg-blue-50 p-4 rounded-md border-l-4 border-blue-600">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Landlord Response
                    </p>
                    <p className="text-gray-700">
                      {review.feedback_text}
                    </p>
                    <div className="mt-1 text-sm text-gray-500 flex items-center">
                      {review.landlord_first_name} {review.landlord_last_name}
                      {review.feedback_date && (
                        <span className="ml-2">· {formatDate(review.feedback_date)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  landlord_id && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <LandlordFeedbackForm
                        review_id={review.id}
                        landlord_id={landlord_id}
                        onFeedbackSubmit={handleFeedbackSubmit}
                      />
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;