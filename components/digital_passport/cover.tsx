"use client";
import Image from "next/image";
import { useCallback } from "react";
import { Share2 } from "lucide-react"; // Optional: Lucide icon

export default function CoverPage() {

    const handleShare = useCallback(() => {
        if (navigator.share) {
            navigator
                .share({
                    title: "Hestia Digital Rent Passport",
                    text: "Check out my Digital Rent Passport from Hestia Rent360.",
                    url: window.location.href,
                })
                .catch((error) => console.error("Error sharing:", error));
        } else {
            alert("Sharing is not supported on this browser.");
        }
    }, []);

    return (
        <div className="page bg-[#1d3557] text-white h-full w-full flex flex-col justify-center items-center p-8">
            <Image
                src="/Hestia-logo-b.svg"
                alt="Hestia Logo"
                width={80}
                height={80}
                className="mb-4"
            />
            <h1 className="text-3xl font-bold mb-2">Rental Passport</h1>
            <p className="text-sm">Hestia Rent360</p>
            <div className="mt-8 border-4 border-white p-4 w-full text-center">
                <p className="uppercase tracking-widest font-semibold">Issued by Hestia</p>
                <p className="text-xs mt-2">For Residential Leasing & Tenant Identification</p>
            </div>
            <button
                onClick={handleShare}
                className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full"
                title="Share Passport"
            >
                <Share2 size={20} />
            </button>
        </div>
    );
}