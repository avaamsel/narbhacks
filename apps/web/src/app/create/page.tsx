"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { MapContainerProps, TileLayerProps, PolylineProps } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapContainer: React.ComponentType<MapContainerProps> = dynamic<MapContainerProps>(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer: React.ComponentType<TileLayerProps> = dynamic<TileLayerProps>(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Polyline: React.ComponentType<PolylineProps> = dynamic<PolylineProps>(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

const walkingBusinesses = [
  { name: "Sunset Coffee", lat: 34.0522, lng: -118.2437, category: "Coffee Shop" }, // center
  { name: "Book Nook", lat: 34.0622, lng: -118.2537, category: "Bookstore" }, // NW
  { name: "Taco Haven", lat: 34.0422, lng: -118.2337, category: "Restaurant" }, // SE
  { name: "Art Gallery", lat: 34.0622, lng: -118.2337, category: "Gallery" }, // NE
  { name: "Park Plaza", lat: 34.0422, lng: -118.2537, category: "Park" }, // SW
  { name: "Tech Hub", lat: 34.0572, lng: -118.2637, category: "Coworking" }, // N
  { name: "Music Store", lat: 34.0572, lng: -118.2237, category: "Music" }, // E
  { name: "Fitness Center", lat: 34.0472, lng: -118.2637, category: "Fitness" }, // S
  { name: "Bakery Corner", lat: 34.0472, lng: -118.2237, category: "Bakery" }, // SE
  { name: "Library", lat: 34.0522, lng: -118.2637, category: "Library" }, // W
];
const wheelsBusinesses = [
  { name: "Drive Thru Diner", lat: 34.1000, lng: -118.3000, category: "Diner" }, // NW
  { name: "Mega Mall", lat: 34.2000, lng: -118.4000, category: "Mall" }, // N
  { name: "MoviePlex", lat: 34.3000, lng: -118.5000, category: "Cinema" }, // NE
  { name: "Car Wash", lat: 34.1000, lng: -118.6000, category: "Service" }, // E
  { name: "Big Park", lat: 34.2000, lng: -118.7000, category: "Park" }, // SE
  { name: "Supermarket", lat: 34.3000, lng: -118.8000, category: "Grocery" }, // S
  { name: "Outlet Center", lat: 34.4000, lng: -118.7000, category: "Outlet" }, // SW
  { name: "Bowling Alley", lat: 34.5000, lng: -118.6000, category: "Bowling" }, // W
  { name: "Electronics Hub", lat: 34.4000, lng: -118.5000, category: "Electronics" }, // NW
  { name: "Mega Gym", lat: 34.5000, lng: -118.4000, category: "Fitness" }, // N
  { name: "Ice Rink", lat: 34.4000, lng: -118.3000, category: "Recreation" }, // NE
  { name: "Drive-In Theater", lat: 34.3000, lng: -118.3000, category: "Theater" }, // E
];

const pathOptions = [
  // Walk options (6 total, spatially diverse)
  {
    key: "option1",
    name: "",
    description: "",
    businesses: [0, 5, 6],
    mode: "walk",
  },
  {
    key: "option2",
    name: "",
    description: "",
    businesses: [1, 4, 8],
    mode: "walk",
  },
  {
    key: "option3",
    name: "",
    description: "",
    businesses: [2, 6, 9, 3],
    mode: "walk",
  },
  {
    key: "option7",
    name: "",
    description: "",
    businesses: [3, 6],
    mode: "walk",
  },
  {
    key: "option8",
    name: "",
    description: "",
    businesses: [4, 1, 6],
    mode: "walk",
  },
  {
    key: "option9",
    name: "",
    description: "",
    businesses: [5, 8, 2, 0],
    mode: "walk",
  },
  {
    key: "option13",
    name: "",
    description: "",
    businesses: [6, 2, 7, 1],
    mode: "walk",
  },
  {
    key: "option14",
    name: "",
    description: "",
    businesses: [8, 3, 0, 5],
    mode: "walk",
  },
  // Wheels options (6 total, spatially diverse)
  {
    key: "option4",
    name: "",
    description: "",
    businesses: [0, 3, 6, 8, 10, 11],
    mode: "wheels",
  },
  {
    key: "option5",
    name: "",
    description: "",
    businesses: [1, 4, 7, 9, 2, 5],
    mode: "wheels",
  },
  {
    key: "option6",
    name: "",
    description: "",
    businesses: [2, 5, 8, 11, 0, 7],
    mode: "wheels",
  },
  {
    key: "option10",
    name: "",
    description: "",
    businesses: [3, 6, 9, 1, 4, 7],
    mode: "wheels",
  },
  {
    key: "option11",
    name: "",
    description: "",
    businesses: [4, 8, 0, 2, 5, 10],
    mode: "wheels",
  },
  {
    key: "option12",
    name: "",
    description: "",
    businesses: [5, 9, 1, 3, 7, 11],
    mode: "wheels",
  },
  {
    key: "option15",
    name: "",
    description: "",
    businesses: [6, 1, 8, 3, 10, 5],
    mode: "wheels",
  },
  {
    key: "option16",
    name: "",
    description: "",
    businesses: [7, 2, 9, 4, 11, 0],
    mode: "wheels",
  },
];

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function calculateRouteInfo(route, businessSet) {
  const routeBusinesses = route.businesses.map((i) => businessSet[i]);
  let totalDistance = 0;
  for (let i = 0; i < routeBusinesses.length - 1; i++) {
    const lat1 = routeBusinesses[i].lat;
    const lng1 = routeBusinesses[i].lng;
    const lat2 = routeBusinesses[i + 1].lat;
    const lng2 = routeBusinesses[i + 1].lng;
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    totalDistance += R * c;
  }
  totalDistance = totalDistance * 1.3;
  const avgSpeed = route.mode === "walk" ? 3 : 8;
  let estimatedTimeMinutes = Math.round((totalDistance / avgSpeed) * 60);

  if (route.mode === "walk") {
    totalDistance = clamp(totalDistance, 1.5, 3);
    estimatedTimeMinutes = clamp(estimatedTimeMinutes, 30, 150); // 30min-2.5hr
  } else {
    totalDistance = clamp(totalDistance, 4, 12);
    estimatedTimeMinutes = clamp(estimatedTimeMinutes, 156, 420); // 2.6hr-7hr
  }

  return {
    distance: totalDistance,
    timeMinutes: estimatedTimeMinutes,
  };
}

const mockFriends = ["Elise", "Ryder", "Gabe", "Jian"];

export default function CreatePathPage() {
  const [mode, setMode] = useState<"walk" | "wheels" | null>(null);
  const [showPaths, setShowPaths] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [randomIndices, setRandomIndices] = useState<number[]>([]);
  // Path naming form state (always defined)
  const [pathName, setPathName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Reset form state when a new path is selected
  useEffect(() => {
    setPathName("");
    setDescription("");
    setSelectedFriends([]);
    if (formRef.current) formRef.current.reset?.();
  }, [selectedPath]);

  // Helper to get 3 random indices for the current mode
  function getRandomIndices(mode: "walk" | "wheels") {
    const options = pathOptions.filter((p) => p.mode === mode);
    const indices = Array.from({ length: options.length }, (_, i) => i);
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Always pick the first 3 unique indices
    return indices.slice(0, 3);
  }

  // Reset random indices when mode or showPaths changes
  useEffect(() => {
    if (mode && showPaths) {
      setRandomIndices(getRandomIndices(mode));
    }
  }, [mode, showPaths]);

  if (!mode) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center bg-[#f5f7fa] pt-24">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-[#4a90e2] mb-6">How do you want to explore?</h1>
            <div className="flex gap-8">
              <button
                className="px-8 py-4 bg-orange-100 text-orange-700 rounded-xl font-bold text-xl hover:bg-orange-200 transition flex flex-col items-center"
                onClick={() => { setMode("walk"); setTimeout(() => setShowPaths(true), 200); }}
              >
                <span className="text-3xl mb-2">🚶</span>
                Walk
              </button>
              <button
                className="px-8 py-4 bg-blue-100 text-blue-700 rounded-xl font-bold text-xl hover:bg-blue-200 transition flex flex-col items-center"
                onClick={() => { setMode("wheels"); setTimeout(() => setShowPaths(true), 200); }}
              >
                <span className="text-3xl mb-2">🚗</span>
                Wheels
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (showPaths && !selectedPath) {
    // Show three random path options styled like /app
    const options = pathOptions.filter((p) => p.mode === mode);
    const businessSet = mode === "walk" ? walkingBusinesses : wheelsBusinesses;
    const filteredPaths = randomIndices.map((i) => options[i]);
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center bg-[#f5f7fa] pt-4 pb-12 transition-opacity duration-500"> 
          <h1 className="text-3xl font-bold text-[#4a90e2] mb-8 mt-4">Choose a Path</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {filteredPaths.map((route) => {
              if (!route) return null;
              const info = calculateRouteInfo(route, businessSet);
              const routeBusinesses = route.businesses.map((i) => businessSet[i]);
              let bounds = [[34.0522, -118.2437], [34.0522, -118.2437]];
              if (routeBusinesses.length > 0) {
                bounds = [
                  [Math.min(...routeBusinesses.map(b => b.lat)), Math.min(...routeBusinesses.map(b => b.lng))],
                  [Math.max(...routeBusinesses.map(b => b.lat)), Math.max(...routeBusinesses.map(b => b.lng))]
                ];
              }
              if (routeBusinesses.length === 0) return null;
              return (
                <div
                  key={route.key}
                  className="border border-[#dbe4ea] rounded-lg p-4 hover:shadow-lg transition flex flex-col bg-white relative cursor-pointer"
                  onClick={() => setSelectedPath(route.key)}
                  style={{ transition: 'box-shadow 0.2s' }}
                >
                  <div className="w-full h-40 min-h-[160px] rounded-md mb-4 overflow-hidden relative">
                    <div className="absolute inset-0">
                      <MapContainer
                        key={route.key}
                        bounds={bounds as [[number, number], [number, number]]}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Polyline
                          positions={routeBusinesses.map(biz => [biz.lat, biz.lng])}
                          pathOptions={{ color: "#4a90e2", weight: 4, opacity: 0.8 }}
                        />
                      </MapContainer>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#3a4a5d] mb-2 flex items-center gap-2">
                    New path option
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${route.mode === 'walk' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{route.mode === 'walk' ? 'Walk' : 'Wheels'}</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">&nbsp;</p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div className="text-xs text-gray-500">Distance</div>
                        <div className="text-sm font-semibold text-[#3a4a5d]">{info.distance.toFixed(1)} mi</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-xs text-gray-500">Time</div>
                        <div className="text-sm font-semibold text-[#3a4a5d]">~{info.timeMinutes}m</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                            <circle cx="12" cy="12" r="4" fill="currentColor" />
                          </svg>
                        </div>
                        <div className="text-xs text-gray-500">Locations</div>
                        <div className="text-sm font-semibold text-[#3a4a5d]">{routeBusinesses.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-row gap-4 justify-center items-center mt-8">
            <button
              className="flex items-center text-[#4a90e2] hover:text-[#357ab8] font-semibold px-4 py-2 bg-white rounded-lg border border-[#dbe4ea]"
              onClick={() => { setShowPaths(false); setMode(null); }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              className="flex items-center text-[#4a90e2] hover:text-[#357ab8] font-semibold px-4 py-2 bg-[#e3eaf6] rounded-lg"
              onClick={() => setRandomIndices(getRandomIndices(mode))}
            >
              Randomize Paths
            </button>
          </div>
        </main>
      </>
    );
  }
  if (showPaths && selectedPath) {
    const options = pathOptions.filter((p) => p.mode === mode);
    const route = options.find((p) => p.key === selectedPath);
    const businessSet = mode === "walk" ? walkingBusinesses : wheelsBusinesses;
    const routeBusinesses = route ? route.businesses.map((i) => businessSet[i]) : [];
    let bounds = [[34.0522, -118.2437], [34.0522, -118.2437]];
    if (routeBusinesses.length > 0) {
      bounds = [
        [Math.min(...routeBusinesses.map(b => b.lat)), Math.min(...routeBusinesses.map(b => b.lng))],
        [Math.max(...routeBusinesses.map(b => b.lat)), Math.max(...routeBusinesses.map(b => b.lng))]
      ];
    }
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center bg-[#f5f7fa] pt-4 pb-12 transition-opacity duration-500">
          <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 bg-white rounded-xl shadow-lg p-8">
            {/* Left: Mini-map */}
            <div className="flex-1 min-w-[300px] max-w-[400px]">
              <div className="w-full h-64 rounded-md overflow-hidden relative">
                <div className="absolute inset-0">
                  {routeBusinesses.length > 0 && (
                    <MapContainer
                      key={route.key}
                      bounds={bounds as [[number, number], [number, number]]}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Polyline
                        positions={routeBusinesses.map(biz => [biz.lat, biz.lng])}
                        pathOptions={{ color: "#4a90e2", weight: 4, opacity: 0.8 }}
                      />
                    </MapContainer>
                  )}
                </div>
              </div>
              {/* Path summary row */}
              <div className="bg-gray-50 rounded-lg p-3 mt-4">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${route.mode === 'walk' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{route.mode === 'walk' ? '🚶 Walk' : '🚗 Wheels'}</span>
                    <div className="text-xs text-gray-500 mt-1">Mode</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-xs text-gray-500">Distance</div>
                    <div className="text-sm font-semibold text-[#3a4a5d]">{calculateRouteInfo(route, businessSet).distance.toFixed(1)} mi</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-xs text-gray-500">Time</div>
                    <div className="text-sm font-semibold text-[#3a4a5d]">~{calculateRouteInfo(route, businessSet).timeMinutes}m</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                        <circle cx="12" cy="12" r="4" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="text-xs text-gray-500">Locations</div>
                    <div className="text-sm font-semibold text-[#3a4a5d]">{routeBusinesses.length}</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right: Form */}
            <div className="flex-1 flex flex-col gap-6">
              <form ref={formRef} className="flex flex-col gap-4">
                <label className="font-semibold text-[#3a4a5d]">Path Name
                  <input
                    type="text"
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4a90e2]"
                    value={pathName}
                    onChange={e => setPathName(e.target.value)}
                    placeholder="Enter a name for your path"
                  />
                </label>
                <label className="font-semibold text-[#3a4a5d]">Description
                  <textarea
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4a90e2]"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe your path"
                  />
                </label>
                <div className="font-semibold text-[#3a4a5d]">Add Friends
                  <div className="flex flex-col gap-2 mt-2">
                    {mockFriends.map(friend => (
                      <label key={friend} className="flex items-center gap-2 font-normal">
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(friend)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedFriends([...selectedFriends, friend]);
                            } else {
                              setSelectedFriends(selectedFriends.filter(f => f !== friend));
                            }
                          }}
                        />
                        {friend}
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          </div>
          {/* Bottom row: Back and Create Path buttons */}
          <div className="flex flex-row gap-4 justify-center items-center w-full max-w-5xl mt-8">
            <button
              className="flex items-center text-[#4a90e2] hover:text-[#357ab8] font-semibold px-4 py-2 bg-white rounded-lg border border-[#dbe4ea]"
              onClick={() => setSelectedPath(null)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              className="flex items-center text-white bg-[#4a90e2] hover:bg-[#357ab8] font-semibold px-6 py-2 rounded-lg shadow"
              onClick={() => {
                // Save new path to localStorage
                const key = 'user_' + Date.now();
                const options = pathOptions.filter((p) => p.mode === mode);
                const route = options.find((p) => p.key === selectedPath);
                const businessSet = mode === "walk" ? walkingBusinesses : wheelsBusinesses;
                if (!route) return;
                const newRoute = {
                  name: pathName || 'Untitled Path',
                  description: description,
                  businesses: route.businesses,
                  mode: route.mode,
                };
                let userRoutes = {};
                try {
                  userRoutes = JSON.parse(localStorage.getItem('userRoutes') || '{}');
                } catch {}
                userRoutes[key] = newRoute;
                localStorage.setItem('userRoutes', JSON.stringify(userRoutes));
                // Redirect to /app?created=1 using Next.js router
                router.push('/app?created=1');
              }}
            >
              Create Path
            </button>
          </div>
        </main>
      </>
    );
  }
  // Path creation form goes here, using the selected mode
  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col items-center bg-[#f5f7fa] pt-4">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-[#4a90e2] mb-6">Create a new {mode === "walk" ? "Walking" : "Wheels"} Path</h1>
          {/* Path creation form fields go here */}
          <p className="text-gray-500">[Path creation form coming soon]</p>
        </div>
      </main>
    </>
  );
}
