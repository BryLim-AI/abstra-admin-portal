"use client";

import { useEffect, useState } from "react";

export default function CookiePermissionStatus() {
    const [cookiesEnabled, setCookiesEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        setCookiesEnabled(navigator.cookieEnabled);
    }, []);

    return (
        <div className="p-3 rounded-md border border-gray-200 bg-gray-50 text-sm">
            {cookiesEnabled === null ? (
                <span>Checking cookie permissions...</span>
            ) : cookiesEnabled ? (
                <span className="text-green-700 font-medium">
          🍪 Cookies are enabled
        </span>
            ) : (
                <span className="text-red-700 font-medium">
          🚫 Cookies are disabled
        </span>
            )}
        </div>
    );
}
