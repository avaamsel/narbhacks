import Header from "@/components/Header";
import { api } from "@/../packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

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

export default function LocationDashboard() {
  const location = useQuery(api.locations.getLocation, {});

  return (
    <main className="bg-[#e6f2ff] min-h-screen">
      <Header />
      <div className="flex flex-col items-center justify-center h-full py-12">
        <h1 className="text-4xl font-bold mb-4 text-blue-900">Your Location Map</h1>
        <p className="mb-6 text-blue-700 text-lg">Track your latest location visually on the map below.</p>
        {location && location.latitude && location.longitude ? (
          <div className="w-full max-w-xl h-[400px] rounded-lg shadow-lg overflow-hidden bg-white">
            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[location.latitude, location.longitude]}>
                <Popup>
                  <span className="font-semibold">You are here!</span>
                  <br />
                  Lat: {location.latitude}
                  <br />
                  Lng: {location.longitude}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="text-gray-500">No location data found.</p>
          </div>
        )}
        {location && (
          <p className="text-xs text-gray-500 mt-4">
            Last updated: {location.timestamp ? new Date(location.timestamp).toLocaleString() : "Unknown"}
          </p>
        )}
      </div>
    </main>
  );
}
