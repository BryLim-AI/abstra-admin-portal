"use client";
import React from "react";
import { Facebook } from 'lucide-react';

const FBShareButton = ({ url }: { url: string }) => {
    const handleShare = () => {
        // @ts-ignore
        window.FB?.ui(
            {
                method: "share",
                href: url,
            },
            (response: any) => {
                console.log("Share result:", response);
            }
        );
    };

    return (
        <button
            onClick={handleShare}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
            <Facebook /> Share to Facebook
        </button>
    );
};

export default FBShareButton;
