"use client";
import { useState } from "react";
import ReviewForm from "../../../../components/tenant/reviewForm";
import useAuth from "../../../../hooks/useSession";

export default function SubmitReviewPage() {
  const { user } = useAuth();
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-lg w-full text-center">
        {reviewSubmitted ? (
          <p className="text-green-600 font-semibold">
            Thank you for your review! 🎉
          </p>
        ) : (
          <ReviewForm
            tenant_id={user?.tenant_id}
            onReviewSubmitted={() => setReviewSubmitted(true)}
          />
        )}
      </div>
    </div>
  );
}
