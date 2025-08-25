"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

export default function PaymentFormPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-pulse text-xl text-gray-600">Loading...</div>
    </div>}>
      <PaymentForm />
    </Suspense>
  );
}

const PaymentForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agreement_id = searchParams.get("agreement_id") || "";
  const queryAmount = searchParams.get("amountPaid") || "";

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState(queryAmount || "");
  const [file, setFile] = useState(null);
  const [paymentType, setPaymentType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const billingId = searchParams.get("billingId") || "";

  useEffect(() => {
    if (queryAmount) {
      setAmountPaid(queryAmount);
    }
  }, [queryAmount]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/payment/method");
        const data = await response.json();
        console.log("Fetched Payment Methods:", data);
        if (data.success) {
          const filteredMethods = data.paymentMethods.filter(
            (method) => method.method_name.toLowerCase() !== "maya"
          );
          setPaymentMethods(filteredMethods);
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        setError("Failed to load payment methods");
      }
    };
    fetchPaymentMethods();
  }, []);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    maxSize: 10485760,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    if (!agreement_id) {
      setError("Missing agreement ID. Please go back and try again.");
      setIsSubmitting(false);
      return;
    }

    if (!amountPaid || amountPaid === "null" || amountPaid === "") {
      setError("Please enter a valid payment amount");
      setIsSubmitting(false);
      return;
    }

    // Validate payment type
    if (
      !["billing", "security_deposit", "advance_rent"].includes(paymentType)
    ) {
      setError("Invalid payment type");
      setIsSubmitting(false);
      return;
    }

    // Validate proof file for certain payment methods
    if (["2", "3", "4"].includes(paymentMethod) && !file) {
      setError("Proof of payment is required for this method");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("agreement_id", agreement_id);
    formData.append("paymentMethod", paymentMethod);
    formData.append("amountPaid", amountPaid);
    formData.append("paymentType", paymentType);

    if (billingId) {
      formData.append("billingId", billingId);
    }

    if (file) {
      formData.append("proof", file);
    }

    try {
      const response = await fetch("/api/payment/upload-proof", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Payment proof uploaded successfully!");
        setTimeout(() => {
          router.push("/pages/tenant/my-unit");
        }, 2000);
      } else {
        setError(`Error: ${data.error || "Failed to upload proof"}`);
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Error submitting payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (billingId) {
      setPaymentType("billing");
    }
  }, [billingId]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">Payment Details</h2>
        
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-xl rounded-xl overflow-hidden"
        >
          <div className="px-6 py-8 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Type
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-gray-700"
              >
                <option value="" disabled>
                  Select payment type
                </option>
                <option value="billing">Billing</option>
                <option value="security_deposit">Security Deposit</option>
                <option value="advance_rent">Advance Rent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-gray-700"
              >
                <option value="" disabled>
                  Select a method
                </option>
                {paymentMethods.map((method, index) => (
                  <option key={method.method_id || index} value={method.method_id}>
                    {method.method_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Amount Paid
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₱</span>
                </div>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {["2", "3", "4"].includes(paymentMethod) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Proof of Payment
                </label>
                <div
                  {...getRootProps()}
                  className={`mt-1 border-2 border-dashed ${
                    file ? "border-indigo-300 bg-indigo-50" : "border-gray-300 bg-gray-50"
                  } rounded-lg px-6 pt-5 pb-6 flex justify-center items-center cursor-pointer hover:bg-gray-100 transition-colors duration-200`}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-1 text-center">
                    <svg
                      className={`mx-auto h-12 w-12 ${file ? "text-indigo-500" : "text-gray-400"}`}
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      {file ? (
                        <p className="text-indigo-600 font-medium">{file.name}</p>
                      ) : (
                        <>
                          <p className="pl-1">Drag & drop or click to upload proof of payment</p>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                isSubmitting 
                  ? "bg-indigo-300 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              } transition-colors duration-200`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Submit Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};