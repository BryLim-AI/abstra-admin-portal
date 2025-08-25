"use client";
import { useEffect, useState } from "react";

const PropertyPhotos = ({ property_id }) => {
    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!property_id) return;

        async function fetchPhotos() {
            try {
                const res = await fetch(`/api/systemadmin/propertyListings/viewPropertyPhotos/${property_id}`);
                const data = await res.json();

                if (data.message) {
                    setError(data.message);
                } else {
                    setPhotos(data.photos || []);
                }
            } catch (err) {
                setError("Failed to load property photos.", err);
            }
            setLoading(false);
        }

        fetchPhotos();
    }, [property_id]);

    if (loading) return <p className="text-center p-4">Loading photos...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div>
            <h2 className="text-2xl font-semibold mt-6">Property Photos</h2>
            <div className="grid grid-cols-3 gap-4">
                {photos.length > 0 ? (
                    photos.map((photo, index) => (
                        <img key={index} src={photo} alt={`Property ${index}`} className="w-full h-40 object-cover border" />
                    ))
                ) : (
                    <p className="text-center">No photos available</p>
                )}
            </div>
        </div>
    );
};

export default PropertyPhotos;
