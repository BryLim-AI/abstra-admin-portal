import React from "react";
import { FaCheck } from "react-icons/fa";

const steps = [
    { id: 1, label: "Location" },
    { id: 2, label: "Amenities/Features" },
    { id: 3, label: "Property Details and Photos" },
    { id: 4, label: "Payment Details" },
];

const StepCounter4 = ({ currentStep }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-xl shadow-md">
            {steps.map((step) => (
                <div
                    key={step.id}
                    className="flex-1 flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-center"
                >
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm ${
                            step.id < currentStep
                                ? "bg-green-500 text-white"
                                : step.id === currentStep
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-500"
                        }`}
                    >
                        {step.id < currentStep ? <FaCheck className="w-4 h-4" /> : step.id}
                    </div>
                    <div
                        className={`text-center text-sm font-medium mt-2 sm:mt-0 sm:ml-4 ${
                            step.id === currentStep
                                ? "text-blue-500"
                                : step.id < currentStep
                                    ? "text-green-500"
                                    : "text-gray-500"
                        }`}
                    >
                        {step.label}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StepCounter4;
