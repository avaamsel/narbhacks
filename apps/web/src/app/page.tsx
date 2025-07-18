"use client";

import Header from "@/components/Header";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useState } from "react";

const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then(mod => mod.Popup),
  { ssr: false }
);

const DEFAULT_LAT = 34.0522;
const DEFAULT_LNG = -118.2437;

// Custom SVG icons as data URLs
const icons = {
  coffee: `data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='16' cy='16' rx='14' ry='14' fill='%23fff'/><ellipse cx='16' cy='16' rx='10' ry='7' fill='%23b5651d'/><ellipse cx='16' cy='16' rx='7' ry='4' fill='%23fff'/><ellipse cx='16' cy='16' rx='4' ry='2' fill='%23b5651d'/></svg>`,
  bookstore: `data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='6' y='8' width='20' height='16' rx='2' fill='%234a90e2'/><rect x='10' y='12' width='12' height='8' rx='1' fill='%23fff'/></svg>`,
  food: `data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='16' cy='20' rx='10' ry='6' fill='%23f5a623'/><ellipse cx='16' cy='20' rx='6' ry='3' fill='%23fff'/><ellipse cx='16' cy='20' rx='3' ry='1.5' fill='%23f5a623'/></svg>`,
  market: `data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='16' cy='16' rx='14' ry='10' fill='%234caf50'/><ellipse cx='16' cy='16' rx='8' ry='4' fill='%23fff'/></svg>`
};

// Sample business data with types
const businesses = [
  {
    name: "Sunset Coffee",
    lat: 34.0525,
    lng: -118.245,
    description: "Cozy local coffee shop with the best cold brew in LA!",
    type: "coffee",
  },
  {
    name: "Book Nook",
    lat: 34.0515,
    lng: -118.242,
    description: "Independent bookstore with a great community vibe.",
    type: "bookstore",
  },
  {
    name: "Taco Haven",
    lat: 34.053,
    lng: -118.244,
    description: "Family-run taqueria serving authentic street tacos.",
    type: "food",
  },
  {
    name: "Green Leaf Market",
    lat: 34.054,
    lng: -118.241,
    description: "Fresh produce and local goods every day!",
    type: "market",
  },
];

export default function LocationDashboard() {
  const location = useQuery(api.locations.getLocation, {});
  const hasLocation = location && location.latitude && location.longitude;
  const center = hasLocation
    ? [location.latitude, location.longitude]
    : [DEFAULT_LAT, DEFAULT_LNG];

  // Local check-in state
  const [checkedIn, setCheckedIn] = useState<{ [name: string]: boolean }>({});

  // Custom icon for business type
  const getIcon = (type: string, visited: boolean) => {
    return L.icon({
      iconUrl: icons[type as keyof typeof icons],
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: visited ? "opacity-60 grayscale" : ""
    });
  };

  return (
    <main className="bg-[#f5f7fa] min-h-screen">
      <Header />
      <div className="flex flex-col items-center justify-center h-full py-10">
        <h1 className="text-4xl font-bold mb-2 text-[#2d2d2d]">Your Location Map</h1>
        <p className="mb-6 text-[#3a4a5d] text-lg">Track your latest location visually on the map below.</p>
        <div className="w-[90vw] max-w-4xl h-[60vh] rounded-xl shadow-lg overflow-hidden bg-white border border-[#dbe4ea]">
          <MapContainer
            center={center as [number, number]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User/default marker */}
            <Marker position={center as [number, number]}>
              <Popup>
                {hasLocation ? (
                  <>
                    <span className="font-semibold">You are here!</span>
                    <br />
                    Lat: {location.latitude}
                    <br />
                    Lng: {location.longitude}
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Default Location: Los Angeles</span>
                    <br />
                    Lat: {DEFAULT_LAT}
                    <br />
                    Lng: {DEFAULT_LNG}
                  </>
                )}
              </Popup>
            </Marker>
            {/* Business pins with custom icons and check-in */}
            {businesses.map((biz) => (
              <Marker
                key={biz.name}
                position={[biz.lat, biz.lng]}
                icon={getIcon(biz.type, checkedIn[biz.name])}
              >
                <Popup>
                  <span className="font-semibold">{biz.name}</span>
                  <br />
                  {biz.description}
                  <br />
                  {checkedIn[biz.name] ? (
                    <span className="text-green-600 font-semibold">You’ve checked in!</span>
                  ) : (
                    <button
                      className="mt-2 px-3 py-1 bg-[#4a90e2] text-white rounded hover:bg-[#357ab8] transition"
                      onClick={() => setCheckedIn((prev) => ({ ...prev, [biz.name]: true }))}
                    >
                      Check In
                    </button>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {hasLocation && (
          <p className="text-xs text-[#3a4a5d] mt-4">
            Last updated: {location.timestamp ? new Date(location.timestamp).toLocaleString() : "Unknown"}
          </p>
        )}
      </div>
    </main>
  );
}
