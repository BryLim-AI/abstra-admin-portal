'use client';

import React, { useState } from 'react';

export default function PropertySearchPage() {
  const [query, setQuery] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

const handleSearch = async () => {
  if (!query.trim()) {
    console.log('[DEBUG] Empty query. Aborting search.');
    return;
  }

  console.log('[DEBUG] Starting search with query:', query);
  setLoading(true);

  try {
    // Step 1: Call NLP /analyze
    const analyzeUrl = `https://sturdy-space-parakeet-9xp45vxp75x3xwx-8000.app.github.dev/analyze?q=${encodeURIComponent(query)}`;
    const res = await fetch(analyzeUrl);

    if (!res.ok) throw new Error(`Analyze failed: HTTP ${res.status}`);
    const data = await res.json();

    console.log('[DEBUG] Analyze Response:', data);
    const extractedKeywords = data.keywords || [];

    setKeywords(extractedKeywords);

    console.log('extracted keywords from keywords: ', keywords);
    console.log('extracted keywords from extractedKeywords: ', extractedKeywords);

    // Step 2: Call /find_rent with keywords
     //@ts-ignore
    const rentUrl = `https://sturdy-space-parakeet-9xp45vxp75x3xwx-8000.app.github.dev/find_rent?${extractedKeywords.map(k => `keywords=${encodeURIComponent(k)}`).join("&")}`;
    console.log('rent url:', rentUrl);
    const rentRes = await fetch(rentUrl);
    console.log('return results:', rentRes);

    if (!rentRes.ok) throw new Error(`Find rent failed: HTTP ${rentRes.status}`);
    const rentData = await rentRes.json();
    console.log('[DEBUG] Rent search results:', rentData);
    setResults(rentData.results || []);
  } catch (err) {
    console.error('[ERROR] Failed to search properties:', err);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 NLP Property Search</h1>

      <input
        type="text"
        value={query}
        placeholder="e.g. studio with balcony in Makati"
        onChange={(e) => {
          console.log('[DEBUG] Input changed:', e.target.value);
          setQuery(e.target.value);
        }}
        className="w-full p-3 border rounded mb-4"
      />

      <button
        onClick={handleSearch}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? 'Analyzing...' : 'Search'}
      </button>

      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">🏠 Matching Properties:</h2>
          <ul className="space-y-4">
            {results.map((property) => (
              <li key={property.property_id} className="border p-4 rounded shadow">
                <p className="font-bold text-xl">{property.property_name}</p>
                <p>{property.city}, {property.province}</p>
                <p>₱{property.rent_amount?.toLocaleString()} / mo</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
