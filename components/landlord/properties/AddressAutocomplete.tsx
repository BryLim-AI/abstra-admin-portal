"use client";
import { useState, useEffect } from "react";
import debounce from "lodash.debounce";

// @ts-ignore
export default function AddressAutocomplete({ value, onSelect }) {
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = debounce(async (search) => {
        if (!search) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`
            );
            const data = await res.json();
            setSuggestions(data);
        } catch (err) {
            console.error("Error fetching address suggestions:", err);
        } finally {
            setLoading(false);
        }
    }, 400);

    useEffect(() => {
        fetchSuggestions(query);
        return () => fetchSuggestions.cancel();
    }, [query]);

    const handleSelect = (place) => {
        setQuery(place.display_name);
        setSuggestions([]);
        onSelect(place); // Return the full place data to parent
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search address..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {loading && <div className="absolute bg-white p-2 text-sm">Loading...</div>}
            {suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded-md max-h-60 overflow-auto w-full">
                    {suggestions.map((sug) => (
                        <li
                            key={sug.place_id}
                            onClick={() => handleSelect(sug)}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                            {sug.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
