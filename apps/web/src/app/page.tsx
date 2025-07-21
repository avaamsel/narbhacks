"use client";
import { useMemo } from "react";
import Header from "@/components/Header";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MapContainerProps } from "react-leaflet";
import type { TileLayerProps } from "react-leaflet";
import type { PolylineProps } from "react-leaflet";
import type { MarkerProps } from "react-leaflet";
import Link from "next/link";
import LeafletIconFix from "@/components/LeafletIconFix";
import { useRouter } from "next/navigation";

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
const Marker: React.ComponentType<MarkerProps> = dynamic<MarkerProps>(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

type Business = {
  name: string;
  lat: number;
  lng: number;
  category: string;
};

type Route = {
  name: string;
  description: string;
  businesses: number[];
  mode: 'walk' | 'wheels';
};

const routes: Record<string, Route> = {
  shortest: {
    name: "Weekend walk",
    description: "Weekend walk with Elise",
    businesses: [0, 2, 4, 6], // 4 locations
    mode: 'walk',
  },
  tricky1: {
    name: "LA Adventure",
    description: "Trip for next Wednesday!",
    businesses: [1, 3, 5, 7, 9, 0, 8], // 7 locations
    mode: 'wheels',
  },
  scenic: {
    name: "Scenic Stroll",
    description: "A relaxing, fun walk past your favorite spots!",
    businesses: [0, 4, 8], // 3 locations
    mode: 'walk',
  }
};

const walkingBusinesses: Business[] = [
  { name: "Sunset Coffee", lat: 34.0522, lng: -118.2437, category: "Coffee Shop" },
  { name: "Book Nook", lat: 34.0582, lng: -118.2487, category: "Bookstore" },
  { name: "Taco Haven", lat: 34.0462, lng: -118.2387, category: "Restaurant" },
  { name: "Art Gallery", lat: 34.0642, lng: -118.2587, category: "Gallery" },
  { name: "Park Plaza", lat: 34.0382, lng: -118.2287, category: "Park" },
  { name: "Tech Hub", lat: 34.0702, lng: -118.2687, category: "Coworking" },
  { name: "Music Store", lat: 34.0442, lng: -118.2337, category: "Music" },
  { name: "Fitness Center", lat: 34.0662, lng: -118.2537, category: "Fitness" },
  { name: "Bakery Corner", lat: 34.0402, lng: -118.2237, category: "Bakery" },
  { name: "Library", lat: 34.0722, lng: -118.2637, category: "Library" }
];

const wheelsBusinesses: Business[] = [
  { name: "Bike Shop", lat: 34.0522, lng: -118.2437, category: "Bike Store" },
  { name: "Skate Park", lat: 34.0582, lng: -118.2487, category: "Park" },
  { name: "Coffee Corner", lat: 34.0462, lng: -118.2387, category: "Coffee Shop" },
  { name: "Art Gallery", lat: 34.0642, lng: -118.2587, category: "Gallery" },
  { name: "Park Plaza", lat: 34.0382, lng: -118.2287, category: "Park" },
  { name: "Tech Hub", lat: 34.0702, lng: -118.2687, category: "Coworking" },
  { name: "Music Store", lat: 34.0442, lng: -118.2337, category: "Music" },
  { name: "Fitness Center", lat: 34.0662, lng: -118.2537, category: "Fitness" },
  { name: "Bakery Corner", lat: 34.0402, lng: -118.2237, category: "Bakery" },
  { name: "Library", lat: 34.0722, lng: -118.2637, category: "Library" }
];

const routeImages: Record<string, string> = {
  shortest: "/images/shortest.jpg",
  tricky1: "/images/tricky1.jpg",
  tricky2: "/images/tricky2.jpg",
};

const sumDistances = (routeBusinesses: Business[], idx: number, acc: number): number => {
  if (idx >= routeBusinesses.length - 1) return acc;
  const lat1 = routeBusinesses[idx].lat;
  const lng1 = routeBusinesses[idx].lng;
  const lat2 = routeBusinesses[idx + 1].lat;
  const lng2 = routeBusinesses[idx + 1].lng;
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return sumDistances(routeBusinesses, idx + 1, acc + R * c);
};

const calculateRouteInfo = (route: Route): { distance: number; timeMinutes: number } => {
  const routeBusinesses = route.businesses.map((i: number) => walkingBusinesses[i]);
  let totalDistance = sumDistances(routeBusinesses, 0, 0);
  totalDistance = totalDistance * 1.3;
  const avgSpeed = 3; // walking mph
  const estimatedTimeMinutes = Math.round((totalDistance / avgSpeed) * 60);
  return {
    distance: totalDistance,
    timeMinutes: estimatedTimeMinutes
  };
};

const MyPaths: React.FC = (): JSX.Element => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hiddenPaths, setHiddenPaths] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<{ routeKey: string | null; type: 'buddies' | 'locations' | null }>({ routeKey: null, type: null });
  useEffect(() => {
    setMounted(true);
  }, []);
  const routeEntries = useMemo((): [string, Route][] => Object.entries(routes), []);
  return (
    <>
      <LeafletIconFix />
      <Header />
      <main className="min-h-screen bg-[#f5f7fa] flex flex-col items-center pb-12">
        <h1 className="text-4xl font-bold text-[#4a90e2] mb-10">My Paths</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {routeEntries.filter(([routeKey]) => !hiddenPaths.includes(routeKey)).map(([routeKey, route]): JSX.Element => {
            const info = calculateRouteInfo(route);
            const businessSet = route.mode === 'walk' ? walkingBusinesses : wheelsBusinesses;
            const routeBusinesses = route.businesses.map((i: number) => businessSet[i]);
            let bounds: [[number, number], [number, number]] = [[34.0522, -118.2437], [34.0522, -118.2437]];
            if (routeBusinesses.length > 0) {
              bounds = [
                [Math.min(...routeBusinesses.map(b => b.lat)), Math.min(...routeBusinesses.map(b => b.lng))],
                [Math.max(...routeBusinesses.map(b => b.lat)), Math.max(...routeBusinesses.map(b => b.lng))]
              ];
            }
            const isBuddiesOpen = openDropdown.routeKey === routeKey && openDropdown.type === 'buddies';
            const isLocationsOpen = openDropdown.routeKey === routeKey && openDropdown.type === 'locations';
            // Determine buddies for each path
            let buddies: string[] = [];
            if (routeKey === 'shortest') {
              buddies = ['Elise'];
            } else if (routeKey === 'tricky1') {
              buddies = ['Elise', 'Ryder', 'Gabe', 'Jian'];
            }
            return (
              <div
                key={routeKey}
                className="border border-[#dbe4ea] rounded-lg p-4 hover:shadow-lg transition flex flex-col bg-white relative"
              >
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl font-bold z-10"
                  aria-label="Delete path"
                  onClick={() => setHiddenPaths(prev => [...prev, routeKey])}
                >
                  ×
                </button>
                <div className="w-full h-40 min-h-[160px] rounded-md mb-4 overflow-hidden relative">
                  <div className="absolute inset-0">
                    {mounted && (
                      <MapContainer
                        key={routeKey}
                        bounds={bounds}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Polyline
                          positions={routeBusinesses.map(biz => [biz.lat, biz.lng])}
                          pathOptions={{ color: "#4a90e2", weight: 4, opacity: 0.8 }}
                        />
                      </MapContainer>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#3a4a5d] mb-2 flex items-center gap-2">
                  {route.name}
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${route.mode === 'walk' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{route.mode === 'walk' ? 'Walk' : 'Wheels'}</span>
                </h3>
                <p className="text-sm text-gray-600 mb-3">{route.description}</p>
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                      </div>
                      <div className="text-xs text-gray-500">Locations</div>
                      <div className="text-sm font-semibold text-[#3a4a5d]">{route.businesses.length}</div>
                    </div>
                  </div>
                </div>
                {/* Path Buddies Dropdown */}
                <div className="mb-2">
                  <button
                    className="w-full flex justify-between items-center px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 font-semibold text-sm"
                    onClick={() => setOpenDropdown(isBuddiesOpen ? { routeKey: null, type: null } : { routeKey, type: 'buddies' })}
                  >
                    Path Buddies
                    <span>{isBuddiesOpen ? '▲' : '▼'}</span>
                  </button>
                  {isBuddiesOpen ? (
                    <div className="p-3 bg-gray-50 border rounded-b text-sm text-gray-600">
                      {buddies.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {buddies.map(buddy => <li key={buddy}>{buddy}</li>)}
                        </ul>
                      ) : (
                        <div>No buddies added yet!</div>
                      )}
                    </div>
                  ) : null}
                </div>
                {/* Locations Dropdown */}
                <div className="mb-2">
                  <button
                    className="w-full flex justify-between items-center px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 font-semibold text-sm"
                    onClick={() => setOpenDropdown(isLocationsOpen ? { routeKey: null, type: null } : { routeKey, type: 'locations' })}
                  >
                    Locations
                    <span>{isLocationsOpen ? '▲' : '▼'}</span>
                  </button>
                  {isLocationsOpen ? (
                    <div className="p-3 bg-gray-50 border rounded-b text-sm text-gray-600">
                      <ul className="list-disc pl-5">
                        {routeBusinesses.map((biz) => (
                          <li key={biz.name}>{biz.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
                <div className="mt-auto flex w-full justify-center">
                  <Link
                    href={`/map?path=${routeKey}`}
                    className="px-4 py-2 bg-[#4a90e2] text-white rounded-lg font-semibold hover:bg-[#357ab8] transition text-center"
                  >
                    View Path
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-12 flex justify-center w-full">
          <Link href="/create" className="px-6 py-3 bg-[#4a90e2] text-white rounded-lg font-semibold shadow hover:bg-[#357ab8] transition text-lg">
            Create New Path
          </Link>
        </div>
      </main>
    </>
  );
};

export default MyPaths;