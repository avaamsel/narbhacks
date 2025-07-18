"use client";

import Header from "@/components/Header";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useState, useMemo, useEffect } from "react";
import L from "leaflet";
import { useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

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
const Polyline = dynamic(
  () => import("react-leaflet").then(mod => mod.Polyline),
  { ssr: false }
);

const MiniMapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
);
const MiniTileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
);
const MiniMarker = dynamic(
  () => import("react-leaflet").then(mod => mod.Marker),
  { ssr: false }
);
const MiniPolyline = dynamic(
  () => import("react-leaflet").then(mod => mod.Polyline),
  { ssr: false }
);

const DEFAULT_LAT = 34.0522;
const DEFAULT_LNG = -118.2437;

// Haversine formula for distance in km
function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simple TSP nearest neighbor for shortest route
function getShortestRoute(start, businesses) {
  const remaining = [...businesses];
  const route = [];
  let current = start;
  while (remaining.length) {
    let minIdx = 0;
    let minDist = getDistance(current.lat, current.lng, remaining[0].lat, remaining[0].lng);
    for (let i = 1; i < remaining.length; i++) {
      const d = getDistance(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
      if (d < minDist) {
        minDist = d;
        minIdx = i;
      }
    }
    route.push(remaining[minIdx]);
    current = remaining[minIdx];
    remaining.splice(minIdx, 1);
  }
  return route;
}

// Random route generator
function getRandomRoute(start, businesses) {
  const shuffled = [...businesses].sort(() => Math.random() - 0.5);
  return shuffled;
}

// Sample business data with types and images
const businesses = [
  {
    name: "Sunset Coffee",
    lat: 34.0525,
    lng: -118.245,
    description: "Cozy local coffee shop with the best cold brew in LA!",
    type: "coffee",
    typeLabel: "Coffee Shop",
    image: "/images/coffee.jpg",
  },
  {
    name: "Book Nook",
    lat: 34.0515,
    lng: -118.242,
    description: "Independent bookstore with a great community vibe.",
    type: "bookstore",
    typeLabel: "Bookstore",
    image: "/images/bookstore.jpg",
  },
  {
    name: "Taco Haven",
    lat: 34.053,
    lng: -118.244,
    description: "Family-run taqueria serving authentic street tacos.",
    type: "food",
    typeLabel: "Taqueria",
    image: "/images/taco.jpg",
  },
  {
    name: "Green Leaf Market",
    lat: 34.054,
    lng: -118.241,
    description: "Fresh produce and local goods every day!",
    type: "market",
    typeLabel: "Market",
    image: "/images/market.jpg",
  },
];

// Helper to sum route distance
function getRouteDistance(start, route) {
  let total = 0;
  let prev = start;
  for (const biz of route) {
    total += getDistance(prev.lat, prev.lng, biz.lat, biz.lng);
    prev = biz;
  }
  return total;
}

const MiniDotIcon = (color: string = '#4a90e2') => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 2px #333;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function LocationDashboard() {
  const location = useQuery(api.locations.getLocation, {});
  const hasLocation = location && location.latitude && location.longitude;
  const center = hasLocation
    ? { lat: location.latitude, lng: location.longitude }
    : { lat: DEFAULT_LAT, lng: DEFAULT_LNG };

  // Local check-in state
  const [checkedIn, setCheckedIn] = useState<{ [name: string]: boolean }>({});
  const [selectedRoute, setSelectedRoute] = useState("shortest");
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [committedRoute, setCommittedRoute] = useState<string>("shortest");
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [travelMode, setTravelMode] = useState<string | null>(null);
  const [showModeModal, setShowModeModal] = useState(true);
  const [checkinTimes, setCheckinTimes] = useState<{ [name: string]: number }>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [routeStarted, setRouteStarted] = useState(false);
  const [showRouteSelect, setShowRouteSelect] = useState(true);
  const [placeName, setPlaceName] = useState("Los Angeles");
  const { isSignedIn } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function fetchPlaceName() {
      if (hasLocation) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}`
          );
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.neighbourhood || data.address.suburb;
          setPlaceName(city || "Los Angeles");
        } catch {
          setPlaceName("Los Angeles");
        }
      }
    }
    fetchPlaceName();
  }, [hasLocation, location?.latitude, location?.longitude]);

  // Custom SVG icons as data URLs (move inside component)
  const icons = {
    coffee: `data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='16' cy='16' rx='14' ry='14' fill='%23fff'/><ellipse cx='16' cy='16' rx='10' ry='7' fill='%23b5651d'/><ellipse cx='16' cy='16' rx='7' ry='4' fill='%23fff'/><ellipse cx='16' cy='16' rx='4' ry='2' fill='%23b5651d'/></svg>`,
    bookstore: `data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='6' y='8' width='20' height='16' rx='2' fill='%234a90e2'/><rect x='10' y='12' width='12' height='8' rx='1' fill='%23fff'/></svg>`,
    food: `data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='16' cy='20' rx='10' ry='6' fill='%23f5a623'/><ellipse cx='16' cy='20' rx='6' ry='3' fill='%23fff'/><ellipse cx='16' cy='20' rx='3' ry='1.5' fill='%23f5a623'/></svg>`,
    market: `data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='16' cy='16' rx='14' ry='10' fill='%234caf50'/><ellipse cx='16' cy='16' rx='8' ry='4' fill='%23fff'/></svg>`
  };

  // Calculate points for each business
  const businessWithPoints = useMemo(() => {
    const startLat = hasLocation ? location.latitude : DEFAULT_LAT;
    const startLng = hasLocation ? location.longitude : DEFAULT_LNG;
    return businesses.map((biz) => {
      const dist = getDistance(startLat, startLng, biz.lat, biz.lng);
      const points = Math.max(10, Math.round(dist * 5));
      return { ...biz, points };
    });
  }, [location, hasLocation]);

  // Total points for checked-in businesses
  const totalPoints = businessWithPoints.reduce(
    (sum, biz) => sum + (checkedIn[biz.name] ? biz.points : 0),
    0
  );

  // Route options
  const routeOptions = useMemo(() => {
    const start = center;
    const shortest = getShortestRoute(start, businessWithPoints);
    const tricky1 = getRandomRoute(start, businessWithPoints);
    const tricky2 = getRandomRoute(start, businessWithPoints);
    return [
      { key: "shortest", name: "Shortest Route", color: "#4a90e2", route: shortest, bonus: 0 },
      { key: "tricky1", name: "Tricky Route 1", color: "#f5a623", route: tricky1, bonus: 50 },
      { key: "tricky2", name: "Tricky Route 2", color: "#e94e77", route: tricky2, bonus: 50 },
    ];
  }, [center.lat, center.lng, businessWithPoints]);

  const activeRoute = routeOptions.find((r) => r.key === selectedRoute) || routeOptions[0];

  // Route completion check
  const routeCompleted = activeRoute.route.every((biz) => checkedIn[biz.name]);
  const totalWithBonus = totalPoints + (routeCompleted && activeRoute.bonus ? activeRoute.bonus : 0);

  // Custom icon for business type
  const getIcon = (type, visited) => {
    return L.icon({
      iconUrl: icons[type],
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: visited ? "opacity-60 grayscale" : ""
    });
  };

  // Polyline positions for the selected route
  const polylinePositions = [
    [center.lat, center.lng],
    ...activeRoute.route.map((biz) => [biz.lat, biz.lng]),
  ];

  const fallbackImage = "/images/pin.svg";

  // Reviews state: { [businessName]: string[] }
  const [reviews, setReviews] = useState<{ [name: string]: string[] }>({});
  const [reviewInput, setReviewInput] = useState("");
  const reviewInputRef = useRef<HTMLInputElement>(null);

  // Show congrats modal when route is completed
  useEffect(() => {
    if (routeCompleted && activeRoute.route.length > 0) {
      setShowCongrats(true);
    }
  }, [routeCompleted, activeRoute.route.length]);

  // When user checks in, record time
  const handleCheckIn = (bizName: string) => {
    if (!routeStarted) return;
    const now = Date.now();
    setCheckedIn((prev) => ({ ...prev, [bizName]: true }));
    setCheckinTimes((prev) => ({ ...prev, [bizName]: now }));
    if (!startTime) setStartTime(now);
  };

  // When route is completed, record end time
  useEffect(() => {
    if (routeCompleted && activeRoute.route.length > 0 && !endTime) {
      setEndTime(Date.now());
    }
  }, [routeCompleted, activeRoute.route.length, endTime]);

  // Only allow switching route via the modal
  const handleRouteSelect = (key: string) => {
    setCommittedRoute(key);
    setSelectedRoute(key);
    setShowSwitchModal(false);
  };

  // When user clicks Start Route, set startTime or show auth modal
  const handleStartRoute = () => {
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }
    setRouteStarted(true);
    if (!startTime) setStartTime(Date.now());
  };

  // Show travel mode modal before route selection
  if (!travelMode && showModeModal) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
          <img src="/images/pin.svg" alt="pathpal icon" width={40} height={40} className="mb-2" />
          <h1 className="text-3xl font-bold mb-1 text-[#4a90e2]">Welcome to pathpal!</h1>
          <div className="mb-6 text-[#3a4a5d] text-lg">let's explore!</div>
          <button
            className="mb-4 px-6 py-3 bg-[#4a90e2] text-white rounded-full text-lg font-semibold hover:bg-[#357ab8] transition"
            onClick={() => { setTravelMode("walking"); setShowModeModal(false); }}
          >
            🚶 Walking
          </button>
          <button
            className="px-6 py-3 bg-[#f5a623] text-white rounded-full text-lg font-semibold hover:bg-[#e94e77] transition"
            onClick={() => { setTravelMode("wheels"); setShowModeModal(false); }}
          >
            🛴 Wheels (bike, scooter, etc.)
          </button>
        </div>
      </div>
    );
  }

  // Show route selection screen after travel mode
  if (showRouteSelect && travelMode) {
    return (
      <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl flex flex-col items-center">
          <img src="/images/pin.svg" alt="pathpal icon" width={40} height={40} className="mb-2" />
          <h1 className="text-3xl font-bold mb-1 text-[#4a90e2]">Welcome to pathpal!</h1>
          <div className="mb-6 text-[#3a4a5d] text-lg">let's explore!</div>
          <h2 className="text-2xl font-bold mb-6 text-[#4a90e2]">Choose Your Route</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {routeOptions.map((r) => {
              const distKm = getRouteDistance(center, r.route);
              const distMi = distKm * 0.621371;
              const walkTimeMin = Math.round((distKm / 4.8) * 60);
              // Mini map center: first business or center
              const miniCenter = r.route.length ? [r.route[0].lat, r.route[0].lng] : [center.lat, center.lng];
              const miniPolyline = [
                [center.lat, center.lng],
                ...r.route.map((biz) => [biz.lat, biz.lng]),
              ];
              return (
                <div key={r.key} className="bg-[#f5f7fa] rounded-lg shadow p-4 flex flex-col items-start border border-[#dbe4ea] h-[420px] justify-between">
                  <div className="w-full">
                    <div className="font-bold text-lg mb-2" style={{ color: r.color }}>{r.name}</div>
                    {r.bonus ? <div className="mb-1 text-xs text-[#e94e77]">Bonus: +{r.bonus}</div> : <div className="mb-1 text-xs" style={{ height: 18 }}></div>}
                    <div className="mb-1 text-xs text-[#3a4a5d]">Distance: {distMi.toFixed(2)} mi / {distKm.toFixed(2)} km</div>
                    <div className="mb-1 text-xs text-[#3a4a5d]">Est. walk: {walkTimeMin} min</div>
                    <div className="my-2 w-full h-24 rounded overflow-hidden border border-[#dbe4ea] bg-white">
                      <MiniMapContainer
                        center={miniCenter as [number, number]}
                        zoom={14}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={false}
                        dragging={false}
                        doubleClickZoom={false}
                        zoomControl={false}
                        attributionControl={false}
                      >
                        <MiniTileLayer
                          attribution=""
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MiniMarker position={[center.lat, center.lng]} icon={MiniDotIcon('#4a90e2')} />
                        {r.route.map((biz, i) => (
                          <MiniMarker key={biz.name} position={[biz.lat, biz.lng]} icon={MiniDotIcon(r.color)} />
                        ))}
                        <MiniPolyline positions={miniPolyline} color={r.color} weight={4} opacity={0.7} />
                      </MiniMapContainer>
                    </div>
                    <ol className="ml-4 mt-2 text-sm text-[#3a4a5d] list-decimal">
                      {r.route.map((biz) => (
                        <li key={biz.name}>{biz.name}</li>
                      ))}
                    </ol>
                  </div>
                  <button
                    className="mt-4 px-4 py-2 bg-[#4a90e2] text-white rounded hover:bg-[#357ab8] transition w-full font-semibold self-end"
                    style={{ marginTop: "auto" }}
                    onClick={() => {
                      setCommittedRoute(r.key);
                      setSelectedRoute(r.key);
                      setShowRouteSelect(false);
                    }}
                  >
                    Choose this route
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Helper to format time
  function formatTime(ts: number | null) {
    if (!ts) return "-";
    return new Date(ts).toLocaleTimeString();
  }
  function formatElapsed(ms: number) {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}m ${sec}s`;
  }

  // Helper to get distance walked so far
  function getDistanceWalkedSoFar() {
    let total = 0;
    let prev = center;
    for (const biz of activeRoute.route) {
      if (!checkedIn[biz.name]) break;
      total += getDistance(prev.lat, prev.lng, biz.lat, biz.lng);
      prev = biz;
    }
    return total;
  }

  return (
    <main className="bg-[#f5f7fa] min-h-screen flex flex-row">
      {/* Congratulatory Modal */}
      {showCongrats && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-md transition-all" />
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative z-10 flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-600"
              onClick={() => setShowCongrats(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2 text-[#4a90e2]">Congratulations!</h2>
            <div className="mb-2 text-[#3a4a5d] text-center">You completed the <span className="font-semibold">{activeRoute.name}</span>!</div>
            <div className="mb-2 text-[#3a4a5d] text-center">
              Total distance: <span className="font-semibold">{getRouteDistance(center, activeRoute.route).toFixed(2)} km</span> / <span className="font-semibold">{(getRouteDistance(center, activeRoute.route) * 0.621371).toFixed(2)} mi</span>
            </div>
            <div className="mb-4 text-[#3a4a5d] text-center">
              Estimated walking time: <span className="font-semibold">{Math.round((getRouteDistance(center, activeRoute.route) / 4.8) * 60)} min</span>
            </div>
            <button
              className="mt-2 px-6 py-2 bg-[#4a90e2] text-white rounded hover:bg-[#357ab8] transition"
              onClick={() => setShowCongrats(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Modal for business info */}
      {activeBusiness && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          {/* Faded/blurred overlay */}
          <div className="absolute inset-0 backdrop-blur-md transition-all" />
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative z-10">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-600"
              onClick={() => setActiveBusiness(null)}
              aria-label="Close"
            >
              ×
            </button>
            <img
              src={activeBusiness.image || fallbackImage}
              alt={activeBusiness.name}
              className="w-full h-40 object-cover rounded mb-4"
              style={{ background: "#f5f7fa" }}
              onError={e => (e.currentTarget.src = fallbackImage)}
            />
            <h2 className="text-2xl font-bold mb-1">{activeBusiness.name}</h2>
            <div className="mb-2 text-[#4a90e2] font-semibold">{activeBusiness.typeLabel}</div>
            <div className="mb-2 text-[#3a4a5d]">{activeBusiness.description}</div>
            <div className="mb-4 text-[#4a90e2] font-bold">+{activeBusiness.points} points</div>
            {/* Reviews Section */}
            <div className="mb-4">
              <div className="font-semibold mb-1 text-[#3a4a5d]">Reviews:</div>
              {reviews[activeBusiness.name]?.length ? (
                <ul className="mb-2 space-y-1 max-h-24 overflow-y-auto">
                  {reviews[activeBusiness.name].map((r, i) => (
                    <li key={i} className="text-sm text-[#2d2d2d] bg-[#f5f7fa] rounded px-2 py-1">{r}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-400 mb-2">No reviews yet.</div>
              )}
            </div>
            {checkedIn[activeBusiness.name] ? (
              <>
                <span className="text-green-600 font-semibold">You’ve checked in!</span>
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    if (reviewInput.trim()) {
                      setReviews(prev => ({
                        ...prev,
                        [activeBusiness.name]: [
                          ...(prev[activeBusiness.name] || []),
                          reviewInput.trim(),
                        ],
                      }));
                      setReviewInput("");
                      setTimeout(() => reviewInputRef.current?.focus(), 0);
                    }
                  }}
                >
                  <input
                    ref={reviewInputRef}
                    type="text"
                    className="flex-1 border border-[#dbe4ea] rounded px-2 py-1 text-sm"
                    placeholder="Leave a review..."
                    value={reviewInput}
                    onChange={e => setReviewInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#4a90e2] text-white rounded hover:bg-[#357ab8] text-sm"
                  >
                    Submit
                  </button>
                </form>
              </>
            ) : (
              <button
                className="mt-2 px-4 py-2 bg-[#4a90e2] text-white rounded hover:bg-[#357ab8] transition"
                onClick={() => handleCheckIn(activeBusiness.name)}
                disabled={!routeStarted}
              >
                Check In
              </button>
            )}
          </div>
        </div>
      )}
      {/* Switch Route Modal (show route cards, note current route) */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-md transition-all" />
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative z-10 flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-600"
              onClick={() => setShowSwitchModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-[#4a90e2]">Choose a Route</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {routeOptions.map((r) => {
                const distKm = getRouteDistance(center, r.route);
                const distMi = distKm * 0.621371;
                const walkTimeMin = Math.round((distKm / 4.8) * 60);
                const miniCenter = r.route.length ? [r.route[0].lat, r.route[0].lng] : [center.lat, center.lng];
                const miniPolyline = [
                  [center.lat, center.lng],
                  ...r.route.map((biz) => [biz.lat, biz.lng]),
                ];
                const isCurrent = committedRoute === r.key;
                return (
                  <div key={r.key} className="bg-[#f5f7fa] rounded-lg shadow p-4 flex flex-col items-start border border-[#dbe4ea] h-[420px] justify-between relative">
                    {isCurrent && (
                      <div className="absolute top-2 right-2 bg-[#4a90e2] text-white text-xs px-2 py-1 rounded">Current</div>
                    )}
                    <div className="w-full">
                      <div className="font-bold text-lg mb-2" style={{ color: r.color }}>{r.name}</div>
                      {r.bonus ? <div className="mb-1 text-xs text-[#e94e77]">Bonus: +{r.bonus}</div> : <div className="mb-1 text-xs" style={{ height: 18 }}></div>}
                      <div className="mb-1 text-xs text-[#3a4a5d]">Distance: {distMi.toFixed(2)} mi / {distKm.toFixed(2)} km</div>
                      <div className="mb-1 text-xs text-[#3a4a5d]">Est. walk: {walkTimeMin} min</div>
                      <div className="my-2 w-full h-24 rounded overflow-hidden border border-[#dbe4ea] bg-white">
                        <MiniMapContainer
                          center={miniCenter as [number, number]}
                          zoom={14}
                          style={{ height: "100%", width: "100%" }}
                          scrollWheelZoom={false}
                          dragging={false}
                          doubleClickZoom={false}
                          zoomControl={false}
                          attributionControl={false}
                        >
                          <MiniTileLayer
                            attribution=""
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <MiniMarker position={[center.lat, center.lng]} icon={MiniDotIcon('#4a90e2')} />
                          {r.route.map((biz, i) => (
                            <MiniMarker key={biz.name} position={[biz.lat, biz.lng]} icon={MiniDotIcon(r.color)} />
                          ))}
                          <MiniPolyline positions={miniPolyline} color={r.color} weight={4} opacity={0.7} />
                        </MiniMapContainer>
                      </div>
                      <ol className="ml-4 mt-2 text-sm text-[#3a4a5d] list-decimal">
                        {r.route.map((biz) => (
                          <li key={biz.name}>{biz.name}</li>
                        ))}
                      </ol>
                    </div>
                    <button
                      className="mt-4 px-4 py-2 bg-[#4a90e2] text-white rounded hover:bg-[#357ab8] transition w-full font-semibold self-end disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ marginTop: "auto" }}
                      onClick={() => handleRouteSelect(r.key)}
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Current Route" : "Choose this route"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Floating Switch Route Button */}
      <button
        className="fixed bottom-6 right-6 z-[1050] bg-[#4a90e2] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#357ab8] transition"
        onClick={() => setShowSwitchModal(true)}
      >
        Switch route?
      </button>
      <aside className="hidden md:flex flex-col w-96 min-h-screen bg-white border-r border-[#dbe4ea] p-6">
        <h2 className="text-2xl font-bold mb-2 text-[#4a90e2]">{activeRoute.name}</h2>
        <div className="text-4xl font-bold text-[#4a90e2] mb-2">{totalWithBonus}</div>
        {routeCompleted && activeRoute.bonus ? (
          <div className="mb-4 text-green-600 font-semibold">Bonus! +{activeRoute.bonus} for completing this route</div>
        ) : null}
        {/* Start Route Button */}
        {!routeStarted ? (
          <button
            className="mb-4 px-6 py-3 bg-[#4a90e2] text-white rounded-full text-lg font-semibold hover:bg-[#357ab8] transition"
            onClick={handleStartRoute}
          >
            Start Route
          </button>
        ) : (
          <div className="mb-4 text-green-600 font-semibold">Route started!</div>
        )}
        <h3 className="text-lg font-semibold mb-2 text-[#3a4a5d]">Locations</h3>
        <ul className="space-y-3 mb-6">
          {activeRoute.route.map((biz) => (
            <li key={biz.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <img src={icons[biz.type]} alt={biz.type} width={20} height={20} />
                <span className={checkedIn[biz.name] ? "line-through text-gray-400" : ""}>{biz.name}</span>
              </span>
              <span className="text-[#4a90e2] font-bold">+{biz.points}</span>
            </li>
          ))}
        </ul>
        <h3 className="text-lg font-semibold mb-2 text-[#3a4a5d]">Route</h3>
        <div className="mb-2 text-xs text-[#3a4a5d]">
          Distance: {(getDistanceWalkedSoFar() * 0.621371).toFixed(2)} mi / {getDistanceWalkedSoFar().toFixed(2)} km<br />
          Est. walk so far: {Math.round((getDistanceWalkedSoFar() / 4.8) * 60)} min
          {routeCompleted && (
            <><br />Total route: {(getRouteDistance(center, activeRoute.route) * 0.621371).toFixed(2)} mi / {getRouteDistance(center, activeRoute.route).toFixed(2)} km</>
          )}
        </div>
        <ol className="ml-6 mt-1 text-sm text-[#3a4a5d] list-decimal">
          {activeRoute.route.map((biz) => (
            <li key={biz.name}>{biz.name}</li>
          ))}
        </ol>
      </aside>
      <div className="flex-1 flex flex-col items-center justify-center h-full py-10">
      <Header />
        <h1 className="text-4xl font-bold mb-2 text-[#2d2d2d] pt-8">Let's explore {placeName}!</h1>
        <p className="mb-6 text-[#3a4a5d] text-lg">Track your latest location visually on the map below.</p>
        <div className="w-[90vw] max-w-4xl h-[60vh] rounded-xl shadow-lg overflow-hidden bg-white border border-[#dbe4ea]">
          <MapContainer
            center={[center.lat, center.lng] as [number, number]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User/default marker */}
            <Marker position={[center.lat, center.lng] as [number, number]} icon={MiniDotIcon('#4a90e2')}>
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
            {businessWithPoints.map((biz) => (
              <Marker
                key={biz.name}
                position={[biz.lat, biz.lng]}
                icon={MiniDotIcon(activeRoute.color)}
                eventHandlers={{
                  click: () => {
                    console.log("Marker clicked:", biz.name);
                    setActiveBusiness(biz);
                  },
                }}
              />
            ))}
            {/* Draw selected route as polyline */}
            <Polyline positions={polylinePositions} color={activeRoute.color} weight={6} opacity={0.7} />
          </MapContainer>
        </div>
        {/* Path Stats Section */}
        {routeStarted && (
          <div className="w-[90vw] max-w-4xl mt-8 bg-white rounded-xl shadow p-6 border border-[#dbe4ea]">
            <h3 className="text-lg font-bold mb-2 text-[#4a90e2]">Your Path Stats</h3>
            <div className="mb-2 text-[#3a4a5d]">Start time: <span className="font-semibold">{formatTime(startTime)}</span></div>
            <ul className="mb-2 text-[#3a4a5d]">
              {activeRoute.route.map((biz) => (
                <li key={biz.name} className="flex items-center gap-2">
                  <span>{biz.name}:</span>
                  <span className="font-mono">{formatTime(checkinTimes[biz.name] || null)}</span>
                </li>
              ))}
            </ul>
            <div className="mb-2 text-[#3a4a5d]">Finish time: <span className="font-semibold">{formatTime(endTime)}</span></div>
            <div className="mb-2 text-[#3a4a5d]">Distance walked so far: <span className="font-semibold">{getDistanceWalkedSoFar().toFixed(2)} km</span> / <span className="font-semibold">{(getDistanceWalkedSoFar() * 0.621371).toFixed(2)} mi</span></div>
            {routeCompleted && (
              <div className="mb-2 text-[#3a4a5d]">Total route: <span className="font-semibold">{getRouteDistance(center, activeRoute.route).toFixed(2)} km</span> / <span className="font-semibold">{(getRouteDistance(center, activeRoute.route) * 0.621371).toFixed(2)} mi</span></div>
            )}
            <div className="text-[#3a4a5d]">Total elapsed: <span className="font-semibold">{startTime && endTime ? formatElapsed(endTime - startTime) : "-"}</span></div>
          </div>
        )}
        {hasLocation && (
          <p className="text-xs text-[#3a4a5d] mt-4">
            Last updated: {location.timestamp ? new Date(location.timestamp).toLocaleString() : "Unknown"}
          </p>
        )}
      </div>
      {/* Auth Modal for non-signed-in users */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-md transition-all" />
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative z-10 flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-600"
              onClick={() => setShowAuthModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-2xl font-bold mb-4 text-[#4a90e2]">Explore this path with an account!</div>
            <div className="mb-6 text-[#3a4a5d] text-center">Sign in or sign up to start your adventure and track your progress.</div>
            <div className="flex gap-4">
              <SignInButton mode="modal">
                <button className="px-6 py-2 bg-[#4a90e2] text-white rounded font-semibold hover:bg-[#357ab8] transition">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-6 py-2 bg-[#f5a623] text-white rounded font-semibold hover:bg-[#e94e77] transition">Sign Up</button>
              </SignUpButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
