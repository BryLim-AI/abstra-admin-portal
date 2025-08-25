"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";

// Custom Marker Icon
const customIcon = L.icon({
  iconUrl: "/marker.png", // Replace with your own icon
  iconSize: [30, 30],
  iconAnchor: [15, 45],
});

const defaultPosition = [14.5995, 120.9842]; // Manila

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.address;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
};

const SearchControl = ({ onSelect }) => {
  const map = useMap();
  const provider = new OpenStreetMapProvider();
  const searchControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    const searchControl = new GeoSearchControl({
      provider,
      showMarker: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
    });

    searchControlRef.current = searchControl;
    map.addControl(searchControl);

    map.on("geosearch/showlocation", async (result) => {
      const { location } = result;
      const address = await reverseGeocode(location.y, location.x);
      onSelect?.({
        lat: location.y,
        lng: location.x,
        address,
      });
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map, provider, onSelect]);

  return null;
};

const DraggableMarker = ({ coords, onMove }) => {
  const [position, setPosition] = useState(coords || defaultPosition);

  useEffect(() => {
    if (coords && coords[0] !== position[0] && coords[1] !== position[1]) {
      setPosition(coords);
    }
  }, [coords]);

  useMapEvents({
    click(e) {
      const newCoords = [e.latlng.lat, e.latlng.lng];
      setPosition(newCoords);
      onMove(newCoords);
    },
  });

  return (
      <Marker
          position={position}
          draggable
          eventHandlers={{
            dragend: async (e) => {
              const latlng = e.target.getLatLng();
              const newCoords = [latlng.lat, latlng.lng];
              setPosition(newCoords);
              onMove(newCoords);
            },
          }}
          icon={customIcon}
      />
  );
};

export default function PropertyMap({ setFields, coordinates }) {
  const [coords, setCoords] = useState(coordinates || defaultPosition);

  // Update internal coords if external coordinates prop changes
  useEffect(() => {
    if (
        coordinates &&
        (coordinates[0] !== coords[0] || coordinates[1] !== coords[1])
    ) {
      setCoords(coordinates);
    }
  }, [coordinates]);

  const handleLocationChange = async (newCoords: number[]) => {
    setCoords(newCoords);

    const [lat, lng] = newCoords;
    const address = await reverseGeocode(lat, lng);

    if (setFields && address) {
      setFields({
        lat,
        lng,
        address: address.road || "",
        barangay: address.suburb || address.neighbourhood || "",
        city: address.city || address.town || address.village || "",
        province: address.state || "",
        region: address.region || "",
        postcode: address.postcode || "",
      });
    }
  };

  return (
      <div className="h-[400px] w-full rounded-lg overflow-hidden border">
        <MapContainer
            center={coords}
            zoom={13}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <SearchControl
              onSelect={({ lat, lng, address }) => {
                const newCoords = [lat, lng];
                setCoords(newCoords);

                if (setFields && address) {
                  setFields({
                    lat,
                    lng,
                    address: address.road || "",
                    barangay: address.suburb || address.neighbourhood || "",
                    city: address.city || address.town || address.village || "",
                    province: address.state || "",
                    region: address.region || "",
                    postcode: address.postcode || "",
                  });
                }
              }}
          />
          <DraggableMarker coords={coords} onMove={handleLocationChange} />
        </MapContainer>
      </div>
  );
}
