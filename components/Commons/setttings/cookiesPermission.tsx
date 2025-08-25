
'use client'
import React, { useState, useEffect } from "react";
import { LiaCookieSolid } from "react-icons/lia";

export default function CookiesPermission() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            setVisible(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("cookie-consent", "accepted");
        setVisible(false);
    };

    const declineCookies = () => {
        localStorage.setItem("cookie-consent", "declined");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white p-4 flex flex-col md:flex-row items-center justify-between shadow-lg z-50">
        <p className="text-sm mb-2 md:mb-0">
            <LiaCookieSolid />
             We use cookies to improve your experience. By clicking “Accept” you agree to our cookie policy.
            <a href="/pages/public/cookiePolicy" className="underline text-sm m-1">
            Learn more
        </a>
    </p>
    <div className="flex space-x-2">
    <button
        onClick={acceptCookies}
    className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
        >
        Accept
        </button>
        <button
    onClick={declineCookies}
    className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
        >
        Decline
        </button>
        </div>
        </div>
);
}
