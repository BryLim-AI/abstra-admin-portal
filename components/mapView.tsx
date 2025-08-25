
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Optional: custom icon to avoid missing marker
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "/marker.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({ coords }: { coords: { lat: number; lng: number } }) {
    return (
        <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={16}
            style={{ height: "300px", width: "100%" }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[coords.lat, coords.lng]}>
                <Popup>Selected Location</Popup>
            </Marker>
        </MapContainer>
    );
}
