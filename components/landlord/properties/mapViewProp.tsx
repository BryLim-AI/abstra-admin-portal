"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon paths using CDN so Next.js won't choke on node_modules assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function MapView({ lat, lng, zoom = 15, height = "320px" }) {
    useEffect(() => {
        // no-op but ensures this component is client-only
    }, []);

    if (!lat || !lng) {
        return (
            <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
                <p className="text-gray-500">Location not available</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg overflow-hidden shadow-sm" style={{ height }}>
            <MapContainer
                center={[Number(lat), Number(lng)]}
                zoom={zoom}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
                aria-label="Property location map"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[Number(lat), Number(lng)]}>
                    <Popup>Property location</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
