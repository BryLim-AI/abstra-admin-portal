export async function geocodeAddress(address: string) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
    headers: {
      "User-Agent": "Hestia-Property-App",
    },
  });

  const data = await res.json();

  if (!data.length) throw new Error("Address not found");

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}
