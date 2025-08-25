"use client";
import React, { useEffect, useState, useRef } from "react";
import useAuth from "../../../../hooks/useSession";
import Webcam from "react-webcam";
import { DOCUMENT_TYPES } from "../../../../constant/docTypes";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  FiInfo,
  FiCheck,
  FiAlertCircle,
  FiCamera,
  FiUpload,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiGlobe,
  FiFileText,
  FiEye,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
} from "react-icons/fi";
import LoadingScreen from "../../../../components/loadingScreen";

// Enhanced Image Quality Checker
const checkImageQuality = (imageData) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;

      // Check brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      const avgBrightness = totalBrightness / (data.length / 4);

      // Check blur (simplified Laplacian variance)
      const grayData = [];
      for (let i = 0; i < data.length; i += 4) {
        grayData.push((data[i] + data[i + 1] + data[i + 2]) / 3);
      }

      let laplacianVariance = 0;
      const width = canvas.width;
      const height = canvas.height;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const laplacian = Math.abs(
            4 * grayData[idx] -
              grayData[idx - 1] -
              grayData[idx + 1] -
              grayData[idx - width] -
              grayData[idx + width]
          );
          laplacianVariance += laplacian * laplacian;
        }
      }
      laplacianVariance = laplacianVariance / ((width - 2) * (height - 2));

      const quality = {
        brightness: avgBrightness,
        isBlurry: laplacianVariance < 100,
        isTooLight: avgBrightness > 200,
        isTooDark: avgBrightness < 50,
        sharpness: laplacianVariance,
      };

      resolve(quality);
    };

    img.src = imageData;
  });
};

export default function LandlordDashboard() {
  const router = useRouter();
  const { user, error } = useAuth();
  const [landlordId, setLandlordId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [uploadOption, setUploadOption] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [capturedDocument, setCapturedDocument] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const webcamRef = useRef(null);
  const addressInputRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  const [imageQuality, setImageQuality] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [captureGuidance, setCaptureGuidance] = useState("");
  const [autoCapture, setAutoCapture] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);

  const steps = [
    {
      id: 1,
      title: "Personal Info",
      icon: FiUser,
      description: "Basic details",
    },
    {
      id: 2,
      title: "ID Document",
      icon: FiFileText,
      description: "Upload or capture",
    },
    {
      id: 3,
      title: "Verification",
      icon: FiCamera,
      description: "Take selfie",
    },
    { id: 4, title: "Review", icon: FiEye, description: "Confirm & submit" },
  ];

  useEffect(() => {
    if (user?.userType === "landlord") {
      setDataLoading(true);
      fetch(`/api/landlord/${user.landlord_id}`)
        .then((res) => res.json())
        .then((data) => {
          setLandlordId(data.landlord_id);
          setFullName(`${user.firstName} ${user.lastName}`);
          setDateOfBirth(user.birthDate);
        })
        .catch((err) => console.error("Error fetching landlord data:", err))
        .finally(() => {
          setDataLoading(false);
        });
    }
  }, [user]);

  useEffect(() => {
    let interval;
    if (captureCountdown > 0) {
      interval = setInterval(() => {
        setCaptureCountdown((prev) => {
          if (prev === 1) {
            handleEnhancedCapture();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [captureCountdown]);
  // auto location completion.
  useEffect(() => {
    if (!address) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              address
          )}&format=json&addressdetails=1&limit=5`
      )
          .then((res) => res.json())
          .then((data) => setSuggestions(data))
          .catch((err) => console.error(err));
    }, 300); // debounce typing

    return () => clearTimeout(timer);
  }, [address]);

  if (dataLoading) return <LoadingScreen />;
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <p className="text-red-600 bg-white p-6 rounded-lg shadow-lg">
          {error}
        </p>
      </div>
    );
  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
        <p className="text-yellow-800 bg-white p-6 rounded-lg shadow-lg">
          You need to log in to access the dashboard.
        </p>
      </div>
    );

  const handleDocumentChange = (event) => {
    setSelectedDocument(event.target.value);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setUploadedFile(file);
  };

  const handleEnhancedCapture = async () => {
    if (webcamRef.current) {
      setIsAnalyzing(true);
      setCaptureGuidance("Analyzing image quality...");

      const imageSrc = webcamRef.current.getScreenshot();

      try {
        const quality = await checkImageQuality(imageSrc);
        setImageQuality(quality);

        if (quality.isBlurry) {
          setCaptureGuidance(
            "Image is blurry. Please hold steady and try again."
          );
          setIsAnalyzing(false);
          return;
        }

        if (quality.isTooDark) {
          setCaptureGuidance("Image is too dark. Please ensure good lighting.");
          setIsAnalyzing(false);
          return;
        }

        if (quality.isTooLight) {
          setCaptureGuidance(
            "Image is overexposed. Adjust lighting and try again."
          );
          setIsAnalyzing(false);
          return;
        }

        setCapturedDocument(imageSrc);
        setCaptureGuidance("Document captured successfully!");
        setIsAnalyzing(false);

        setTimeout(() => setCaptureGuidance(""), 3000);
      } catch (error) {
        console.error("Error analyzing image:", error);
        setCapturedDocument(imageSrc);
        setCaptureGuidance("Document captured (analysis unavailable)");
        setIsAnalyzing(false);
      }
    }
  };

  const startAutoCapture = () => {
    setAutoCapture(true);
    setCaptureCountdown(3);
    setCaptureGuidance("Position your document in frame. Auto-capture in:");
  };

  const captureSelfie = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setSelfie(imageSrc);
      setIsCameraOpen(false);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("documentType", selectedDocument);
    if (uploadedFile) {
      formData.append("uploadedFile", uploadedFile);
    } else if (capturedDocument) {
      formData.append("capturedDocument", capturedDocument);
    }
    formData.append("selfie", selfie);
    formData.append("landlord_id", landlordId);
    formData.append("fullName", fullName);
    formData.append("address", address);
    formData.append("dateOfBirth", dateOfBirth);
    formData.append("citizenship", citizenship);

    try {
      const response = await fetch("/api/landlord/verification-upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed!");
      }
      Swal.fire({
        title: "Success!",
        text: "Verification Submitted Successfully!",
        icon: "success",
        confirmButtonColor: "#10B981",
        background: "#F0FDF4",
      });
      router.push("/pages/landlord/dashboard");
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Something went wrong: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#EF4444",
      });
    }
  };

  const getQualityIndicator = () => {
    if (!imageQuality) return null;

    const issues = [];
    if (imageQuality.isBlurry) issues.push("Blurry");
    if (imageQuality.isTooDark) issues.push("Too Dark");
    if (imageQuality.isTooLight) issues.push("Too Light");

    if (issues.length === 0) {
      return (
        <div className="flex items-center text-emerald-600 text-sm mt-3 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
          <FiCheckCircle className="mr-2 text-lg" />
          <span className="font-medium">Excellent image quality!</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-amber-600 text-sm mt-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
          <FiAlertCircle className="mr-2 text-lg" />
          <div>
            <p className="font-medium">Image quality issues detected:</p>
            <p className="text-xs mt-1">{issues.join(", ")}</p>
          </div>
        </div>
      );
    }
  };

  const isStepComplete = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return fullName && address && dateOfBirth && citizenship;
      case 2:
        return selectedDocument && (uploadedFile || capturedDocument);
      case 3:
        return selfie;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const canProceed = () => {
    return isStepComplete(currentStep);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Landlord Identity Verification
          </h1>
          <p className="text-gray-600">
            Secure verification process to protect your account and ensure trust
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted =
                currentStep > step.id ||
                (currentStep === step.id && isStepComplete(step.id));

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center flex-1"
                >
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-lg"
                        : isActive
                        ? "bg-blue-500 text-white shadow-lg scale-110"
                        : "bg-gray-200 text-gray-400"
                    }
                  `}
                  >
                    {isCompleted && currentStep > step.id ? (
                      <FiCheck className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`font-medium text-sm ${
                        isActive
                          ? "text-blue-600"
                          : isCompleted
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-xs ${
                        isActive ? "text-blue-500" : "text-gray-400"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                      absolute top-6 w-full h-0.5 -z-10 transition-all duration-300
                      ${isCompleted ? "bg-emerald-500" : "bg-gray-200"}
                    `}
                      style={{ left: "50%", width: `${100 / steps.length}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>


          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>


        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">

            {currentStep === 1 && (

              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <FiUser className="w-6 h-6 text-blue-500 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Personal Information
                  </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                      Full Legal Name
                    </label>
                    <input
                        type="text"
                        value={fullName || ""} // use state, allow empty string
                        onChange={(e) => setFullName(e.target.value)} // update state on edit
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                        placeholder="Your full legal name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                      Date of Birth
                    </label>
                    <input
                        type="date"
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        value={dateOfBirth || ""} // <-- use state, allow empty string
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                    />

                  </div>

                  <div className="md:col-span-2 space-y-2 relative">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                      Home Address
                    </label>
                    <input
                        ref={addressInputRef}
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Start typing your address..."
                    />
                    {address.length > 0 && (
                        <ul className="absolute z-10 bg-white border border-gray-200 w-full rounded-xl max-h-60 overflow-auto mt-1">
                          {suggestions.map((item, idx) => (
                              <li
                                  key={idx}
                                  onClick={() => {
                                    setAddress(item.display_name);
                                    setSuggestions([]);
                                  }}
                                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                              >
                                {item.display_name}
                              </li>
                          ))}
                        </ul>
                    )}
                  </div>


                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FiGlobe className="w-4 h-4 mr-2 text-gray-400" />
                      Place of Birth
                    </label>
                    <input
                      type="text"
                      value={citizenship}
                      onChange={(e) => setCitizenship(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your place of birth"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <FiFileText className="w-6 h-6 text-blue-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Identity Document
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  >
                    <FiInfo className="w-4 h-4 mr-1" />
                    What's accepted?
                  </button>
                </div>

                {isModalOpen && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Accepted Documents
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-emerald-600 flex items-center mb-2">
                            <FiCheckCircle className="w-4 h-4 mr-2" />
                            Accepted IDs
                          </h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Government-issued Passport</li>
                            <li>• National ID Card</li>
                            <li>• Driver's License</li>
                            <li>• State ID Card</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-600 flex items-center mb-2">
                            <FiAlertCircle className="w-4 h-4 mr-2" />
                            Not Accepted
                          </h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Membership cards</li>
                            <li>• School/Student ID</li>
                            <li>• Work badges</li>
                            <li>• Expired documents</li>
                          </ul>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                      >
                        Got it!
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Document Type
                  </label>
                  <select
                    value={selectedDocument}
                    onChange={handleDocumentChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Choose your document type...</option>
                    {DOCUMENT_TYPES.map((doc) => (
                      <option key={doc.value} value={doc.value}>
                        {doc.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDocument && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      How would you like to provide your document?
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setUploadOption("upload")}
                        className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                          uploadOption === "upload"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        <FiUpload className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-medium">Upload File</p>
                        <p className="text-xs opacity-75">From your device</p>
                      </button>

                      <button
                        onClick={() => setUploadOption("capture")}
                        className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                          uploadOption === "capture"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        <FiCamera className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-medium">Take Photo</p>
                        <p className="text-xs opacity-75">Use camera</p>
                      </button>
                    </div>

                    {uploadOption === "upload" && (
                      <div className="mt-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                          <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
                          >
                            Choose File
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            PNG, JPG up to 10MB
                          </p>
                        </div>

                        {uploadedFile && (
                          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <div className="flex items-center">
                              <FiCheckCircle className="w-5 h-5 text-emerald-600 mr-3" />
                              <div>
                                <p className="font-medium text-emerald-800">
                                  File uploaded successfully!
                                </p>
                                <p className="text-sm text-emerald-600">
                                  {uploadedFile.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {uploadOption === "capture" && (
                      <div className="mt-6 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                            <FiInfo className="w-4 h-4 mr-2" />
                            Capture Tips
                          </h4>
                          <ul className="text-blue-700 text-sm space-y-1">
                            <li>• Ensure document fills most of the frame</li>
                            <li>• Use bright, even lighting</li>
                            <li>• Avoid shadows and glare</li>
                            <li>• Keep camera steady and focused</li>
                            <li>• Ensure all text is clearly readable</li>
                          </ul>
                        </div>

                        <div className="relative">
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full rounded-xl border-2 border-gray-200"
                            videoConstraints={{
                              width: 1280,
                              height: 720,
                              facingMode: "user",
                            }}
                          />

                          {captureGuidance && (
                            <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-center backdrop-blur-sm">
                              <p className="text-sm">
                                {captureCountdown > 0
                                  ? `${captureGuidance} ${captureCountdown}`
                                  : captureGuidance}
                              </p>
                            </div>
                          )}

                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-8 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleEnhancedCapture}
                            disabled={isAnalyzing}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
                          >
                            {isAnalyzing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <FiCamera className="w-4 h-4 mr-2" />
                                Capture Document
                              </>
                            )}
                          </button>

                          <button
                            onClick={startAutoCapture}
                            disabled={isAnalyzing || captureCountdown > 0}
                            className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
                          >
                            {captureCountdown > 0 ? (
                              <>
                                <div className="animate-pulse w-4 h-4 bg-white rounded-full mr-2"></div>
                                Auto-capture ({captureCountdown}s)
                              </>
                            ) : (
                              "Auto-capture"
                            )}
                          </button>
                        </div>

                        {getQualityIndicator()}

                        {capturedDocument && (
                          <div className="mt-6 space-y-4">
                            <div className="text-center">
                              <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                              <h3 className="font-semibold text-emerald-700 text-lg">
                                Document Captured!
                              </h3>
                            </div>

                            <div className="relative">
                              <img
                                src={capturedDocument}
                                alt="Document Preview"
                                className="w-full max-w-md mx-auto rounded-xl border-2 border-emerald-200 shadow-lg"
                              />
                            </div>

                            <button
                              onClick={() => {
                                setCapturedDocument(null);
                                setImageQuality(null);
                                setCaptureGuidance("");
                              }}
                              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                            >
                              Retake Photo
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <FiCamera className="w-6 h-6 text-blue-500 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Identity Verification
                  </h2>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start">
                    <FiInfo className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-800 mb-1">
                        Selfie Guidelines
                      </h4>
                      <ul className="text-amber-700 text-sm space-y-1">
                        <li>• Look directly at the camera</li>
                        <li>
                          • Ensure your face is well-lit and clearly visible
                        </li>
                        <li>• Remove sunglasses and hats</li>
                        <li>• Keep a neutral expression</li>
                        <li>• Make sure your full face fits in the frame</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {isCameraOpen ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full max-w-md mx-auto rounded-xl border-2 border-gray-200 shadow-lg"
                        videoConstraints={{
                          width: 640,
                          height: 480,
                          facingMode: "user",
                        }}
                      />

                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-64 border-2 border-white border-dashed rounded-full opacity-50"></div>
                      </div>
                    </div>

                    <button
                      onClick={captureSelfie}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
                    >
                      <FiCamera className="w-4 h-4 mr-2" />
                      Take Selfie
                    </button>
                  </div>
                ) : selfie ? (
                  <div className="space-y-4 text-center">
                    <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h3 className="font-semibold text-emerald-700 text-lg">
                      Perfect!
                    </h3>

                    <img
                      src={selfie}
                      alt="Selfie Preview"
                      className="w-48 h-64 object-cover rounded-xl border-2 border-emerald-200 shadow-lg mx-auto"
                    />

                    <button
                      onClick={() => setIsCameraOpen(true)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                    >
                      Retake Selfie
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <FiCamera className="w-12 h-12 text-blue-500" />
                    </div>

                    <button
                      onClick={() => setIsCameraOpen(true)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
                    >
                      <FiCamera className="w-4 h-4 mr-2" />
                      Open Camera for Selfie
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <FiEye className="w-6 h-6 text-blue-500 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Review & Submit
                  </h2>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Verify Your Information
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Full Legal Name
                      </p>
                      <p className="text-gray-900">{fullName}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Date of Birth
                      </p>
                      <p className="text-gray-900">{dateOfBirth}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Home Address
                      </p>
                      <p className="text-gray-900">{address}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Place of Birth
                      </p>
                      <p className="text-gray-900">{citizenship}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Document Type
                      </p>
                      <p className="text-gray-900">
                        {
                          DOCUMENT_TYPES.find(
                            (doc) => doc.value === selectedDocument
                          )?.label
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Uploaded Documents
                  </h4>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">
                        Identity Document
                      </p>
                      {uploadedFile ? (
                        <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <FiFileText className="w-5 h-5 text-blue-600 mr-3" />
                          <span className="text-blue-800">
                            {uploadedFile.name}
                          </span>
                        </div>
                      ) : capturedDocument ? (
                        <img
                          src={capturedDocument}
                          alt="Document Preview"
                          className="w-full max-w-xs rounded-lg border shadow-sm"
                        />
                      ) : null}
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-2">
                        Identity Verification
                      </p>
                      {selfie && (
                        <img
                          src={selfie}
                          alt="Selfie Preview"
                          className="w-32 h-40 object-cover rounded-lg border shadow-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <FiShield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">
                        Privacy & Security
                      </h4>
                      <p className="text-blue-700 text-sm">
                        Your documents are encrypted and processed securely. We
                        use this information solely for identity verification
                        purposes in compliance with applicable regulations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed()}
                  className="inline-flex items-center px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  Continue
                  <FiArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FiCheckCircle className="w-4 h-4 mr-2" />
                  Submit Verification
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
