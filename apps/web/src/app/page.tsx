"use client";
import Header from "@/components/Header";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { SignInButton, SignUpButton, SignOutButton } from "@clerk/nextjs";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Declare Leaflet on window object
declare global {
  interface Window {
    L: any;
  }
}

// Dynamic imports for map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

// Default coordinates (Los Angeles)
const DEFAULT_LAT = 34.0522;
const DEFAULT_LNG = -118.2437;

// Marker colors for different businesses
const markerColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
];

// Custom icon for business markers
const MiniDotIcon = (color: string) => {
  if (typeof window !== "undefined" && window.L) {
    return window.L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 10px;">📍</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }
  return undefined;
};

// Custom icon for route preview markers (smaller)
const PreviewDotIcon = (color: string) => {
  if (typeof window !== "undefined" && window.L) {
    return window.L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }
  return undefined;
};

// Enhanced business data with images, descriptions, and reviews
const businessData = {
  "Sunset Coffee": {
    image: "/images/coffee-shop.jpg",
    description: "A cozy coffee shop with the best sunset views in LA. Known for their artisanal coffee and relaxed atmosphere.",
    reviews: [
      { user: "Sarah M.", rating: 5, comment: "Amazing coffee and beautiful sunset views! Perfect spot to work or relax.", date: "2024-01-15" },
      { user: "Mike T.", rating: 4, comment: "Great vibes and friendly staff. The oat milk latte is fantastic.", date: "2024-01-10" },
      { user: "Emma L.", rating: 5, comment: "Love the outdoor seating area. Perfect for people watching!", date: "2024-01-08" }
    ]
  },
  "Book Nook": {
    image: "/images/bookstore.jpg", 
    description: "Independent bookstore with rare books and a charming reading nook. Hosts author events and book clubs.",
    reviews: [
      { user: "David K.", rating: 5, comment: "Found some amazing rare books here. The staff is incredibly knowledgeable.", date: "2024-01-12" },
      { user: "Lisa R.", rating: 4, comment: "Cozy atmosphere and great selection of local authors.", date: "2024-01-05" }
    ]
  },
  "Taco Haven": {
    image: "/images/restaurant.jpg",
    description: "Authentic Mexican street tacos with fresh ingredients and homemade salsas. A local favorite for quick, delicious meals.",
    reviews: [
      { user: "Carlos M.", rating: 5, comment: "Best tacos in the neighborhood! The al pastor is incredible.", date: "2024-01-14" },
      { user: "Ana S.", rating: 4, comment: "Fresh ingredients and authentic flavors. Great prices too!", date: "2024-01-09" }
    ]
  },
  "Art Gallery": {
    image: "/images/gallery.jpg",
    description: "Contemporary art gallery featuring local and international artists. Regular exhibitions and artist talks.",
    reviews: [
      { user: "Jennifer W.", rating: 5, comment: "Stunning contemporary art. The current exhibition is mind-blowing.", date: "2024-01-13" },
      { user: "Tom B.", rating: 4, comment: "Great space and interesting exhibits. Free admission on Thursdays!", date: "2024-01-07" }
    ]
  },
  "Park Plaza": {
    image: "/images/park.jpg",
    description: "Beautiful urban park with walking trails, picnic areas, and a community garden. Perfect for outdoor activities.",
    reviews: [
      { user: "Rachel G.", rating: 5, comment: "Love walking my dog here. The community garden is beautiful.", date: "2024-01-11" },
      { user: "Mark H.", rating: 4, comment: "Great place for a picnic or afternoon walk. Clean and well-maintained.", date: "2024-01-06" }
    ]
  },
  "Tech Hub": {
    image: "/images/coworking.jpg",
    description: "Modern coworking space with high-speed internet, meeting rooms, and networking events for tech professionals.",
    reviews: [
      { user: "Alex P.", rating: 5, comment: "Perfect workspace with great amenities. The networking events are valuable.", date: "2024-01-16" },
      { user: "Sophie K.", rating: 4, comment: "Clean, quiet, and professional. Coffee is always fresh.", date: "2024-01-04" }
    ]
  },
  "Music Store": {
    image: "/images/music-store.jpg",
    description: "Independent music store specializing in vinyl records and musical instruments. Regular live performances.",
    reviews: [
      { user: "Jake L.", rating: 5, comment: "Found some rare vinyl here! The staff really knows their music.", date: "2024-01-15" },
      { user: "Maria C.", rating: 4, comment: "Great selection of instruments and friendly staff.", date: "2024-01-08" }
    ]
  },
  "Fitness Center": {
    image: "/images/fitness.jpg",
    description: "Modern fitness center with state-of-the-art equipment, group classes, and personal training services.",
    reviews: [
      { user: "Chris T.", rating: 5, comment: "Best gym in the area. Clean equipment and great trainers.", date: "2024-01-14" },
      { user: "Nina R.", rating: 4, comment: "Love the yoga classes. The facility is always clean.", date: "2024-01-09" }
    ]
  },
  "Bakery Corner": {
    image: "/images/bakery.jpg",
    description: "Artisanal bakery with fresh bread, pastries, and custom cakes. Everything is made from scratch daily.",
    reviews: [
      { user: "Grace W.", rating: 5, comment: "Best croissants in LA! The sourdough bread is amazing.", date: "2024-01-12" },
      { user: "Ryan M.", rating: 4, comment: "Delicious pastries and friendly service. Great coffee too.", date: "2024-01-05" }
    ]
  },
  "Library": {
    image: "/images/library.jpg",
    description: "Public library with extensive book collection, study rooms, and community programs for all ages.",
    reviews: [
      { user: "Patricia L.", rating: 5, comment: "Wonderful library with helpful staff. Great study spaces.", date: "2024-01-13" },
      { user: "Kevin B.", rating: 4, comment: "Excellent selection of books and quiet study areas.", date: "2024-01-07" }
    ]
  }
};

// Business data with locations and points - different sets for walking vs wheels
const walkingBusinesses = [
  { name: "Sunset Coffee", lat: 34.0522, lng: -118.2437, points: 50, category: "Coffee Shop" },
  { name: "Book Nook", lat: 34.0582, lng: -118.2487, points: 75, category: "Bookstore" },
  { name: "Taco Haven", lat: 34.0462, lng: -118.2387, points: 30, category: "Restaurant" },
  { name: "Art Gallery", lat: 34.0642, lng: -118.2587, points: 100, category: "Gallery" },
  { name: "Park Plaza", lat: 34.0382, lng: -118.2287, points: 25, category: "Park" },
  { name: "Tech Hub", lat: 34.0702, lng: -118.2687, points: 80, category: "Coworking" },
  { name: "Music Store", lat: 34.0442, lng: -118.2337, points: 60, category: "Music" },
  { name: "Fitness Center", lat: 34.0662, lng: -118.2537, points: 45, category: "Fitness" },
  { name: "Bakery Corner", lat: 34.0402, lng: -118.2237, points: 35, category: "Bakery" },
  { name: "Library", lat: 34.0722, lng: -118.2637, points: 90, category: "Library" }
];

const wheelsBusinesses = [
  { name: "Sunset Coffee", lat: 34.0522, lng: -118.2437, points: 50, category: "Coffee Shop" },
  { name: "Book Nook", lat: 34.1016, lng: -118.3267, points: 75, category: "Bookstore" },
  { name: "Taco Haven", lat: 34.0736, lng: -118.2400, points: 30, category: "Restaurant" },
  { name: "Art Gallery", lat: 34.0928, lng: -118.3287, points: 100, category: "Gallery" },
  { name: "Park Plaza", lat: 34.0118, lng: -118.4942, points: 25, category: "Park" },
  { name: "Tech Hub", lat: 34.0622, lng: -118.2537, points: 80, category: "Coworking" },
  { name: "Music Store", lat: 34.0422, lng: -118.2337, points: 60, category: "Music" },
  { name: "Fitness Center", lat: 34.0722, lng: -118.2637, points: 45, category: "Fitness" },
  { name: "Bakery Corner", lat: 34.0322, lng: -118.2237, points: 35, category: "Bakery" },
  { name: "Library", lat: 34.0822, lng: -118.2737, points: 90, category: "Library" }
];

// Route definitions
const routes = {
  shortest: {
    name: "Shortest Route",
    description: "Quickest path to maximize points",
    businesses: [0, 2, 4, 6, 8], // Indices of businesses to visit
    totalPoints: 200
  },
  tricky1: {
    name: "Tricky Route 1", 
    description: "Challenging path with high rewards",
    businesses: [1, 3, 5, 7, 9],
    totalPoints: 350
  },
  tricky2: {
    name: "Tricky Route 2",
    description: "Adventure path with mixed rewards", 
    businesses: [0, 1, 3, 5, 8],
    totalPoints: 280
  }
};

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [travelMode, setTravelMode] = useState<string | null>(null);
  const [showModeModal, setShowModeModal] = useState(true);
  const [showRouteSelect, setShowRouteSelect] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [browserLocation, setBrowserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [visitedLocations, setVisitedLocations] = useState<Set<string>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [adventureStarted, setAdventureStarted] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [adventureStartTime, setAdventureStartTime] = useState<Date | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionStats, setCompletionStats] = useState({
    distance: 0,
    points: 0,
    timeElapsed: 0
  });
  const [showWalkStatsModal, setShowWalkStatsModal] = useState(false);
  const [showMyAccountModal, setShowMyAccountModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [checkInTimes, setCheckInTimes] = useState<Map<string, Date>>(new Map());

  // Automatically close the travel mode modal when signed in
  useEffect(() => {
    // Only close the modal if user is signed in AND has selected a travel mode
    if (isSignedIn && travelMode && showModeModal) {
      setShowModeModal(false);
    }
  }, [isSignedIn, showModeModal]);

  // Get user's location from Convex
  const location = useQuery(api.locations.getLocation, {});

  // Get the appropriate business set based on travel mode
  const currentBusinesses = travelMode === "walking" ? walkingBusinesses : wheelsBusinesses;
  
  // Add colors to businesses
  const businessWithPoints = useMemo(() => {
    return currentBusinesses.map((biz, i) => ({
      ...biz,
      color: markerColors[i % markerColors.length]
    }));
  }, [currentBusinesses]);

  // Get businesses for selected route
  const routeBusinesses = selectedRoute ? 
    routes[selectedRoute as keyof typeof routes].businesses.map(i => businessWithPoints[i]) : 
    [];

  // Get user's browser location when signed in
  useEffect(() => {
    if (isSignedIn && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBrowserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Error getting location:", error);
        }
      );
    }
  }, [isSignedIn]);

  // Check for route completion
  useEffect(() => {
    if (selectedRoute && adventureStarted && routeBusinesses.length > 0) {
      const allVisited = routeBusinesses.every(biz => visitedLocations.has(biz.name));
      
      if (allVisited && !showCompletionModal) {
        // Calculate completion stats
        const endTime = new Date();
        const timeElapsed = adventureStartTime ? Math.floor((endTime.getTime() - adventureStartTime.getTime()) / 1000) : 0;
        
        // Calculate approximate distance (simplified - could be enhanced with actual route calculation)
        const estimatedDistance = routeBusinesses.length * 0.5; // Rough estimate: 0.5 miles per location
        
        setCompletionStats({
          distance: estimatedDistance,
          points: totalPoints,
          timeElapsed: timeElapsed
        });
        
        setShowCompletionModal(true);
      }
    }
  }, [selectedRoute, adventureStarted, visitedLocations, routeBusinesses, showCompletionModal, adventureStartTime, totalPoints]);

  // Calculate map center based on user location
  const mapCenter = browserLocation ? browserLocation : [DEFAULT_LAT, DEFAULT_LNG];

  // Main dashboard content component
  const DashboardContent = () => {
    // Check if we're on client side and map components are available
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
      setIsClient(true);
    }, []);

    if (!isClient) {
      return (
        <main className="min-h-screen bg-[#f5f7fa] flex flex-col">
          <Header onStatsClick={() => setShowStatsModal(true)} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4a90e2] mb-4">Loading Map...</div>
              <div className="text-[#3a4a5d]">Please wait while we initialize the map</div>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-[#f5f7fa] flex flex-col">
        <Header onStatsClick={() => setShowStatsModal(true)} />
        <div className="flex h-[calc(100vh-80px)]">
          {/* Map Section */}
          <div className="flex-1 relative pr-80">
            <MapContainer
              center={mapCenter as [number, number]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
            
            {/* Choose Route Button Overlay */}
            <div className="absolute bottom-6 left-6 z-[1000]">
              <button
                onClick={() => { setShowRouteSelect(true); setSelectedRoute(null); }}
                className="bg-white rounded-xl shadow-lg px-6 py-3 font-semibold text-[#4a90e2] hover:bg-[#f5f7fa] transition flex items-center space-x-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Choose New Route</span>
              </button>
            </div>
            
            {/* Current Route Indicator */}
            {selectedRoute && (
              <div className="absolute top-6 left-6 z-[1000]">
                <div className="bg-white rounded-xl shadow-lg px-4 py-3">
                  <div className="text-sm font-semibold text-[#4a90e2] mb-1">Current Route</div>
                  <div className="text-lg font-bold text-[#3a4a5d]">
                    {routes[selectedRoute as keyof typeof routes].name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {routes[selectedRoute as keyof typeof routes].totalPoints} total points
                  </div>
                </div>
              </div>
            )}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User location marker */}
            {browserLocation && (
              <Marker position={[browserLocation.lat, browserLocation.lng]}>
                <Popup>
                  <div className="text-center">
                    <div className="font-bold text-blue-600">You are here!</div>
                    <div className="text-sm text-gray-600">
                      {browserLocation.lat.toFixed(4)}, {browserLocation.lng.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Business markers - Only show locations in selected route */}
            {(selectedRoute ? routeBusinesses : businessWithPoints).map((biz, index) => {
              const icon = MiniDotIcon(biz.color);
              const businessInfo = businessData[biz.name as keyof typeof businessData];
              const isVisited = visitedLocations.has(biz.name);
              
              return icon ? (
                <Marker 
                  key={biz.name} 
                  position={[biz.lat, biz.lng]}
                  icon={icon}
                >
                  <Popup className="custom-popup">
                    <div className="w-80 max-w-sm">
                      {/* Location Image */}
                      <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                        <img 
                          src={businessInfo?.image || "/images/pin.svg"} 
                          alt={biz.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/images/pin.svg";
                          }}
                        />
                      </div>
                      
                      {/* Location Info */}
                      <div className="mb-3">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{biz.name}</h3>
                        <div className="text-sm text-blue-600 font-semibold mb-2">{biz.category}</div>
                        <div className="text-sm text-gray-600 mb-2">{businessInfo?.description}</div>
                        <div className="text-lg font-bold text-blue-600">{biz.points} pts</div>
                      </div>
                      
                      {/* Check-in Button */}
                      <button
                        onClick={() => {
                          if (!isVisited && adventureStarted) {
                            setVisitedLocations(prev => new Set([...prev, biz.name]));
                            setTotalPoints(prev => prev + biz.points);
                            setCheckInTimes(prev => new Map([...prev, [biz.name, new Date()]]));
                          }
                        }}
                        className={`w-full py-2 px-4 rounded-lg font-semibold mb-3 transition ${
                          isVisited 
                            ? 'bg-green-500 text-white cursor-default' 
                            : !adventureStarted
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        disabled={!adventureStarted}
                      >
                        {isVisited ? '✓ Checked In!' : !adventureStarted ? 'Start Adventure First' : 'Check In'}
                      </button>
                      
                      {/* Reviews Section */}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-800">Reviews</h4>
                          <button
                            onClick={() => {
                              setSelectedBusiness(biz.name);
                              setShowReviewModal(true);
                            }}
                            className="text-blue-600 text-sm hover:underline"
                          >
                            View All
                          </button>
                        </div>
                        
                        {/* Preview of first review */}
                        {businessInfo?.reviews && businessInfo.reviews.length > 0 && (
                          <div className="bg-gray-50 p-2 rounded text-sm">
                            <div className="flex items-center mb-1">
                              <span className="font-semibold text-gray-800">{businessInfo.reviews[0].user}</span>
                              <div className="flex ml-2">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className="text-yellow-400">
                                    {i < businessInfo.reviews[0].rating ? '★' : '☆'}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 text-xs">{businessInfo.reviews[0].comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null;
            })}

            {/* Route path if selected */}
            {selectedRoute && routeBusinesses.length > 0 && (
              <Polyline
                positions={routeBusinesses.map(biz => [biz.lat, biz.lng])}
                color="#4a90e2"
                weight={4}
                opacity={0.8}
              />
            )}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg overflow-y-auto h-full fixed right-0 top-16">
          <div className="p-6 pb-20">
            <h2 className="text-2xl font-bold text-[#4a90e2] mb-4">Pathpal Explorer</h2>
            
            {/* Points Counter */}
            <div className="mb-6 p-4 rounded-lg text-white" style={{backgroundColor: '#4a90e2'}}>
              <div className="text-sm font-semibold mb-1">Total Points</div>
              <div className="text-3xl font-bold">{totalPoints}</div>
              {selectedRoute && (
                <div className="text-xs mt-1 opacity-90">
                  {visitedLocations.size} of {routeBusinesses.length} locations visited
                </div>
              )}
            </div>
            
            {/* Start Exploring Button */}
            {!adventureStarted && selectedRoute && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setAdventureStarted(true);
                    setAdventureStartTime(new Date());
                  }}
                  className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition"
                >
                  🚀 Start Exploring!
                </button>
                <div className="text-xs text-gray-600 mt-2 text-center">
                  Begin your journey to earn points!
                </div>
              </div>
            )}
            
            {/* Adventure Status */}
            {adventureStarted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">🎯</span>
                  <span className="font-semibold text-green-800">Exploring Active!</span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Check in at locations to earn points
                </div>
              </div>
            )}
            
            {/* Travel Mode Info */}
            {travelMode && (
              <div className="mb-6 p-4 bg-[#e6f2ff] rounded-lg">
                <div className="text-sm text-[#4a90e2] font-semibold">Travel Mode</div>
                <div className="text-lg font-bold text-[#3a4a5d]">
                  {travelMode === "walking" ? "🚶 Walking" : "🛴 Wheels"}
                </div>
              </div>
            )}

            {/* Selected Route Info */}
            {selectedRoute && (
              <div className="mb-6 p-4 bg-[#f5f7fa] rounded-lg">
                <div className="text-sm text-[#4a90e2] font-semibold">Selected Route</div>
                <div className="text-lg font-bold text-[#3a4a5d]">
                  {routes[selectedRoute as keyof typeof routes].name}
                </div>
                <div className="text-sm text-[#3a4a5d]">
                  {routes[selectedRoute as keyof typeof routes].description}
                </div>
                <div className="text-lg font-bold text-blue-600 mt-2">
                  {routes[selectedRoute as keyof typeof routes].totalPoints} total points
                </div>
              </div>
            )}

            {/* Route Locations */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#4a90e2] mb-3">
                {selectedRoute ? "Your Route Locations" : "All Nearby Locations"}
              </h3>
              <div className="space-y-2">
                {(selectedRoute ? routeBusinesses : businessWithPoints).map((biz, index) => {
                  const isVisited = visitedLocations.has(biz.name);
                  return (
                    <div key={biz.name} className={`flex items-center p-3 rounded-lg transition ${
                      isVisited ? 'bg-green-50 border border-green-200' : 'bg-[#f5f7fa]'
                    }`}>
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: biz.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="font-semibold text-[#3a4a5d] flex items-center">
                          {biz.name}
                          {isVisited && (
                            <span className="ml-2 text-green-600 text-sm">✓</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{biz.category}</div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">{biz.points}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {adventureStarted && selectedRoute && (
                <button 
                  onClick={() => setShowWalkStatsModal(true)}
                  className="w-full px-4 py-3 bg-[#4a90e2] text-white rounded-lg font-semibold hover:bg-[#357ab8] transition"
                >
                  Walk Stats
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
  };

  // Welcome modal
  if (!travelMode && showModeModal) {
    return (
      <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-[#f5f7fa]">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
          <img src="/images/pin.svg" alt="pathpal icon" width={40} height={40} className="mb-2" />
          {isSignedIn ? (
            <>
              <h1 className="text-2xl font-bold mb-1 text-[#4a90e2] text-center">
                Welcome back to pathpal,<br />
                <span className="text-xl font-semibold">{user?.fullName || user?.username || "explorer"}</span>!
              </h1>
              <div className="mb-4 text-[#3a4a5d] text-center text-base">
                pathpal is a gamification style geolocation app intended to get users to explore the area around them and find fun new areas to frequent!
              </div>
              <div className="mb-6 text-[#3a4a5d] text-base text-center">let's explore!</div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-1 text-[#4a90e2]">Welcome to pathpal!</h1>
              <div className="mb-4 text-[#3a4a5d] text-center text-base">
                pathpal is a gamification style geolocation app intended to get users to explore the area around them and find fun new areas to frequent!
              </div>
              <div className="mb-6 text-[#3a4a5d] text-lg">let's explore!</div>
            </>
          )}
          <div className="mb-6 mt-2 w-full flex flex-col items-center">
            <div className="text-base font-semibold text-[#4a90e2] mb-2">How are you exploring today?</div>
            <hr className="w-2/3 border-t border-[#dbe4ea] mb-2" />
          </div>
          <button
            className="mb-4 px-6 py-3 bg-[#4a90e2] text-white rounded-full text-lg font-semibold hover:bg-[#357ab8] transition"
            onClick={() => { setTravelMode("walking"); setShowModeModal(false); setShowRouteSelect(true); }}
          >
            🚶 Walking
          </button>
          <button
            className="px-6 py-3 bg-[#f5a623] text-white rounded-full text-lg font-semibold hover:bg-[#e94e77] transition"
            onClick={() => { setTravelMode("wheels"); setShowModeModal(false); setShowRouteSelect(true); }}
          >
            🛴 Wheels (bike, scooter, etc.)
          </button>
          <div className="w-full flex flex-col items-center">
            {isSignedIn ? (
              <SignOutButton>
                <button className="mt-6 px-6 py-2 bg-[#e94e77] text-white rounded font-semibold hover:bg-[#c43c5e] transition text-lg">Sign Out</button>
              </SignOutButton>
            ) : (
              <SignInButton mode="modal">
                <button className="mt-6 px-6 py-2 bg-[#4a90e2] text-white rounded font-semibold hover:bg-[#357ab8] transition text-lg">Sign In</button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Route preview component
  const RoutePreview = ({ routeKey, route }: { routeKey: string; route: any }) => {
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
      setIsClient(true);
    }, []);

    if (!isClient) {
      return (
        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      );
    }

    const routeBusinesses = route.businesses.map((i: number) => businessWithPoints[i]);
    
    // Calculate bounds to show entire route
    const bounds = routeBusinesses.length > 0 ? [
      [Math.min(...routeBusinesses.map(b => b.lat)), Math.min(...routeBusinesses.map(b => b.lng))],
      [Math.max(...routeBusinesses.map(b => b.lat)), Math.max(...routeBusinesses.map(b => b.lng))]
    ] : [[DEFAULT_LAT, DEFAULT_LNG], [DEFAULT_LAT, DEFAULT_LNG]];

    return (
      <div className="w-full h-48 rounded-lg overflow-hidden border border-[#dbe4ea]">
        <MapContainer
          bounds={bounds as [[number, number], [number, number]]}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          maxBounds={bounds as [[number, number], [number, number]]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Route markers */}
          {routeBusinesses.map((biz: any, index: number) => {
            const icon = PreviewDotIcon(biz.color);
            return icon ? (
              <Marker 
                key={biz.name} 
                position={[biz.lat, biz.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-bold text-gray-800">{biz.name}</div>
                    <div className="text-sm text-gray-600">{biz.category}</div>
                    <div className="text-lg font-bold text-blue-600">{biz.points} pts</div>
                  </div>
                </Popup>
              </Marker>
            ) : null;
          })}

          {/* Route path */}
          {routeBusinesses.length > 0 && (
            <Polyline
              positions={routeBusinesses.map((biz: any) => [biz.lat, biz.lng])}
              color="#4a90e2"
              weight={3}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>
    );
  };

  // Calculate route distance and time
  const calculateRouteInfo = (route: any) => {
    const routeBusinesses = route.businesses.map((i: number) => businessWithPoints[i]);
    
    // Calculate total distance (simplified - straight line distances)
    let totalDistance = 0;
    for (let i = 0; i < routeBusinesses.length - 1; i++) {
      const lat1 = routeBusinesses[i].lat;
      const lng1 = routeBusinesses[i].lng;
      const lat2 = routeBusinesses[i + 1].lat;
      const lng2 = routeBusinesses[i + 1].lng;
      
      // Haversine formula for distance calculation
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDistance += R * c;
    }
    
    // Add some extra distance for realistic routing (not straight lines)
    totalDistance = totalDistance * 1.3;
    
    // Calculate estimated time based on travel mode
    const avgSpeed = travelMode === "walking" ? 3 : 8; // mph
    const estimatedTimeMinutes = Math.round((totalDistance / avgSpeed) * 60);
    
    return {
      distance: totalDistance,
      timeMinutes: estimatedTimeMinutes
    };
  };

  // Route Selection Modal
  if (showRouteSelect && travelMode) {
    return (
      <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-blue-50">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#4a90e2]">Choose Your Route</h1>
              <p className="text-[#3a4a5d] mt-1">
                {travelMode === "walking" ? "🚶 Walking" : "🛴 Wheels"} - Select an adventure path
              </p>
            </div>
            <button
              onClick={() => { setShowRouteSelect(false); setShowModeModal(true); setTravelMode(null); }}
              className="flex items-center space-x-2 text-[#4a90e2] hover:text-[#357ab8] font-semibold transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          </div>

          {/* Route Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(routes).map(([routeKey, route]) => (
              <div key={routeKey} className="border border-[#dbe4ea] rounded-lg p-4 hover:shadow-lg transition">
                <h3 className="text-lg font-bold text-[#3a4a5d] mb-2">{route.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{route.description}</p>
                
                {/* Route Info (Distance and Time) */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="text-xs text-gray-500">Distance</div>
                      <div className="text-sm font-semibold text-[#3a4a5d]">{(calculateRouteInfo(route).distance).toFixed(1)} mi</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-xs text-gray-500">Time</div>
                      <div className="text-sm font-semibold text-[#3a4a5d]">~{calculateRouteInfo(route).timeMinutes}m</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                      </div>
                      <div className="text-xs text-gray-500">Points</div>
                      <div className="text-sm font-semibold text-[#3a4a5d]">{route.totalPoints}</div>
                    </div>
                  </div>
                </div>
                
                {/* Route Preview */}
                <RoutePreview routeKey={routeKey} route={route} />
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-lg font-bold text-[#4a90e2]">
                    {route.totalPoints} points
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRoute(routeKey);
                      setShowRouteSelect(false);
                    }}
                    className="px-4 py-2 bg-[#4a90e2] text-white rounded-lg font-semibold hover:bg-[#357ab8] transition"
                  >
                    Start Route
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Walk Stats Modal
  if (showWalkStatsModal) {
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    };

    const currentTime = new Date();
    const timeElapsed = adventureStartTime ? Math.floor((currentTime.getTime() - adventureStartTime.getTime()) / 1000) : 0;
    const estimatedDistance = visitedLocations.size * 0.5; // Rough estimate: 0.5 miles per visited location
    const progressPercentage = routeBusinesses.length > 0 ? (visitedLocations.size / routeBusinesses.length) * 100 : 0;

    return (
      <div className="fixed inset-0 z-[2300] flex flex-col items-center justify-center bg-[#f5f7fa]">
        {/* Blurred background content */}
        <div className="absolute inset-0 blur-sm opacity-30 pointer-events-none">
          <div className="flex h-[calc(100vh-80px)]">
            <div className="flex-1 relative pr-80 bg-gray-200">{/* Simplified map background */}</div>
            <div className="w-80 bg-white shadow-lg overflow-y-auto h-full fixed right-0 top-16">
              <div className="p-6 pb-20">
                <h2 className="text-2xl font-bold text-[#4a90e2] mb-4">Pathpal Explorer</h2>
              </div>
            </div>
          </div>
        </div>
        {/* Modal content */}
        <div className="relative z-[2400] bg-white rounded-xl shadow-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col items-center">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-6">
            <h1 className="text-2xl font-bold text-[#4a90e2]">Walk Stats</h1>
            <button
              onClick={() => setShowWalkStatsModal(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: '#FF6B6B'
                }}
              ></div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="w-full space-y-4 mb-6">
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#FF6B6B'}}>
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-sm opacity-90">Points Earned</div>
            </div>
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#4ECDC4'}}>
              <div className="text-2xl font-bold">{visitedLocations.size}</div>
              <div className="text-sm opacity-90">Locations Visited</div>
            </div>
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#45B7D1'}}>
              <div className="text-2xl font-bold">{estimatedDistance.toFixed(1)}</div>
              <div className="text-sm opacity-90">Miles Travelled</div>
            </div>
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#96CEB4'}}>
              <div className="text-2xl font-bold">{formatTime(timeElapsed)}</div>
              <div className="text-sm opacity-90">Time Elapsed</div>
            </div>
          </div>

          {/* Start Time */}
          {adventureStartTime && (
            <div className="w-full bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-lg font-semibold text-[#4a90e2] mb-2">Adventure Started</div>
              <div className="text-xl font-bold text-[#3a4a5d]">
                {adventureStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-sm text-gray-600">
                {adventureStartTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          )}

          {/* Check-in Times */}
          {visitedLocations.size > 0 && (
            <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-lg font-semibold text-[#4a90e2] mb-3">Check-in Times</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {routeBusinesses
                  .filter(biz => visitedLocations.has(biz.name))
                  .map((biz, index) => (
                    <div key={biz.name} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: biz.color }}
                        ></div>
                        <div>
                          <div className="font-semibold text-[#3a4a5d]">{biz.name}</div>
                          <div className="text-xs text-gray-500">{biz.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[#4a90e2]">{biz.points} pts</div>
                        <div className="text-xs text-gray-500">
                          {checkInTimes.get(biz.name)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--:--'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Current Route Info */}
          {selectedRoute && (
            <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-lg font-semibold text-[#4a90e2] mb-2">Current Route</div>
              <div className="text-xl font-bold text-[#3a4a5d] mb-1">
                {routes[selectedRoute as keyof typeof routes].name}
              </div>
              <div className="text-sm text-gray-600">
                {visitedLocations.size} of {routeBusinesses.length} locations completed
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => setShowWalkStatsModal(false)}
            className="w-full py-3 bg-[#4a90e2] text-white rounded-lg font-semibold hover:bg-[#357ab8] transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Completion Modal
  if (showCompletionModal) {
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    };

    return (
      <div className="fixed inset-0 z-[2300] flex flex-col items-center justify-center bg-[#f5f7fa]">
        {/* Blurred background content */}
        <div className="absolute inset-0 blur-sm opacity-30 pointer-events-none">
          <div className="flex h-[calc(100vh-80px)]">
            <div className="flex-1 relative pr-80 bg-gray-200">{/* Simplified map background */}</div>
            <div className="w-80 bg-white shadow-lg overflow-y-auto h-full fixed right-0 top-16">
              <div className="p-6 pb-20">
                <h2 className="text-2xl font-bold text-[#4a90e2] mb-4">Pathpal Explorer</h2>
              </div>
            </div>
          </div>
        </div>
        {/* Modal content */}
        <div className="relative z-[2400] bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
          {/* Celebration Icon */}
          <div className="text-6xl mb-4">🎉</div>
          {/* Congratulations Message */}
          <h1 className="text-3xl font-bold text-[#4a90e2] text-center mb-2">
            Congratulations!
          </h1>
          <p className="text-lg text-[#3a4a5d] text-center mb-6">
            You've completed your adventure!
          </p>
          {/* Stats Cards */}
          <div className="w-full space-y-4 mb-6">
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#FF6B6B'}}>
              <div className="text-2xl font-bold">{completionStats.points}</div>
              <div className="text-sm opacity-90">Points Earned</div>
            </div>
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#4ECDC4'}}>
              <div className="text-2xl font-bold">{routeBusinesses.length}</div>
              <div className="text-sm opacity-90">Locations</div>
            </div>
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#45B7D1'}}>
              <div className="text-2xl font-bold">{completionStats.distance.toFixed(1)}</div>
              <div className="text-sm opacity-90">Miles Walked</div>
            </div>
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#96CEB4'}}>
              <div className="text-2xl font-bold">{formatTime(completionStats.timeElapsed)}</div>
              <div className="text-sm opacity-90">Time Elapsed</div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={() => {
                setShowCompletionModal(false);
                setAdventureStarted(false);
                setSelectedRoute(null);
                setVisitedLocations(new Set());
                setTotalPoints(0);
                setAdventureStartTime(null);
              }}
              className="w-full py-3 bg-[#4a90e2] text-white rounded-lg font-semibold hover:bg-[#357ab8] transition"
            >
              Start New Adventure
            </button>
            <Link href="/stats">
              <button className="w-full py-3 bg-[#f5a623] text-white rounded-lg font-semibold hover:bg-[#e94e77] transition">
                View Stats
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // My Account Modal
  if (showMyAccountModal) {
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    };

    const currentTime = new Date();
    const timeElapsed = adventureStartTime ? Math.floor((currentTime.getTime() - adventureStartTime.getTime()) / 1000) : 0;
    const estimatedDistance = visitedLocations.size * 0.5; // Rough estimate: 0.5 miles per visited location

    return (
      <div className="fixed inset-0 z-[2200] flex flex-col items-center justify-center bg-[#f5f7fa]">
        {/* Blurred background content */}
        <div className="absolute inset-0 blur-sm opacity-30 pointer-events-none">
          <div className="flex h-[calc(100vh-80px)]">
            <div className="flex-1 relative pr-80 bg-gray-200">
              {/* Simplified map background */}
            </div>
            <div className="w-80 bg-white shadow-lg overflow-y-auto h-full fixed right-0 top-16">
              <div className="p-6 pb-20">
                <h2 className="text-2xl font-bold text-[#4a90e2] mb-4">Pathpal Explorer</h2>
              </div>
            </div>
          </div>
        </div>
        {/* My Account popup */}
        <div className="relative z-[2000] flex flex-col items-center justify-center w-full max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full flex flex-col items-center relative">
            {/* X button to exit */}
            <button
              type="button"
              onClick={() => setShowMyAccountModal(false)}
              className="absolute top-4 right-4 text-[#3a4a5d] hover:text-[#4a90e2] transition-colors"
              aria-label="Close my account"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <img src="/images/pin.svg" alt="pathpal icon" width={40} height={40} className="mb-2" />
            <h1 className="text-2xl font-bold mb-4 text-[#4a90e2] text-center">My Account</h1>
            
            <div className="flex flex-row w-full gap-8">
              {/* Left sidebar */}
              <aside className="w-80 bg-[#f5f7fa] rounded-xl p-6 flex flex-col items-center border border-[#dbe4ea]">
                <img
                  src={user?.imageUrl || "/images/pin.svg"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full mb-4 border-4 border-[#4a90e2] object-cover"
                />
                <h2 className="text-2xl font-bold mb-2 text-[#4a90e2] text-center">
                  {user?.fullName || user?.username || "Pathpal Explorer"}
                </h2>
                {user?.createdAt && (
                  <div className="mb-2 text-[#3a4a5d] text-sm text-center">
                    Date Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                )}
                <div className="mb-6 text-[#4a90e2] text-2xl font-bold text-center">Total Points: {totalPoints}</div>
                
                {/* Current Walk Stats */}
                {adventureStarted && selectedRoute && (
                  <div className="w-full flex flex-col gap-4 mb-6">
                    <div className="text-lg font-semibold text-[#4a90e2] text-center mb-2">Current Walk</div>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-[#3a4a5d]">Distance:</span>
                      <span className="font-mono">{estimatedDistance.toFixed(1)} mi</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-[#3a4a5d]">Time:</span>
                      <span className="font-mono">{formatTime(timeElapsed)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-[#3a4a5d]">Locations:</span>
                      <span className="font-mono">{visitedLocations.size} visited</span>
                    </div>
                    {adventureStartTime && (
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-[#3a4a5d]">Started:</span>
                        <span className="font-mono">{adventureStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                )}
              </aside>
              
              {/* Right main content */}
              <section className="flex-1 flex flex-col gap-6">
                {/* Current Route Info */}
                {selectedRoute && (
                  <div className="w-full bg-[#e6f2ff] rounded p-4">
                    <div className="text-lg font-semibold text-[#4a90e2] mb-1">Current Route</div>
                    <div className="text-xl font-bold text-[#3a4a5d] mb-2">
                      {routes[selectedRoute as keyof typeof routes].name}
                    </div>
                    <div className="text-[#3a4a5d] mb-3">
                      {routes[selectedRoute as keyof typeof routes].description}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {routes[selectedRoute as keyof typeof routes].totalPoints} total points
                    </div>
                  </div>
                )}
                
                {/* Visited Locations */}
                {visitedLocations.size > 0 && (
                  <div className="w-full bg-[#f5f7fa] rounded p-4">
                    <div className="text-lg font-semibold text-[#4a90e2] mb-3">Visited Locations</div>
                    <div className="space-y-2">
                      {routeBusinesses.filter(biz => visitedLocations.has(biz.name)).map((biz, index) => (
                        <div key={biz.name} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: biz.color }}
                            ></div>
                            <div>
                              <div className="font-semibold text-[#3a4a5d]">{biz.name}</div>
                              <div className="text-sm text-gray-600">{biz.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{biz.points} pts</div>
                            <div className="text-xs text-gray-500">Checked in</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Remaining Locations */}
                {selectedRoute && routeBusinesses.filter(biz => !visitedLocations.has(biz.name)).length > 0 && (
                  <div className="w-full bg-[#f5f7fa] rounded p-4">
                    <div className="text-lg font-semibold text-[#4a90e2] mb-3">Remaining Locations</div>
                    <div className="space-y-2">
                      {routeBusinesses.filter(biz => !visitedLocations.has(biz.name)).map((biz, index) => (
                        <div key={biz.name} className="flex items-center justify-between p-2 bg-white rounded border opacity-60">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: biz.color }}
                            ></div>
                            <div>
                              <div className="font-semibold text-[#3a4a5d]">{biz.name}</div>
                              <div className="text-sm text-gray-600">{biz.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{biz.points} pts</div>
                            <div className="text-xs text-gray-500">Not visited</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stats Modal (for not logged in users)
  if (showStatsModal && !isSignedIn) {
    // Mock stats for demo
    const totalMiles = 123.4;
    const totalMinutes = 2100;
    const totalPoints = 420;
    const city = "Los Angeles";

    // Mock city visit data
    const cityVisits = [
      { name: "Los Angeles", lastVisit: "2024-06-08T14:30:00Z", count: 8 },
      { name: "Santa Monica", lastVisit: "2024-06-07T11:00:00Z", count: 3 },
      { name: "San Diego", lastVisit: "2024-06-01T09:15:00Z", count: 2 },
      { name: "Pasadena", lastVisit: "2024-05-30T16:45:00Z", count: 1 },
    ];
    const favoriteCity = cityVisits.reduce((fav, c) => (c.count > fav.count ? c : fav), cityVisits[0]);

    // Mock favorite businesses
    const favoriteBusinesses = [
      { name: "Sunset Coffee", city: "Los Angeles", visits: 5 },
      { name: "Book Nook", city: "Santa Monica", visits: 3 },
      { name: "Taco Haven", city: "Los Angeles", visits: 2 },
    ];

    // Mock leaderboard data
    const leaderboard = [
      { name: "You", points: totalPoints, image: "/images/pin.svg" },
      { name: "Ava", points: 390, image: "/images/profile.png" },
      { name: "Sam", points: 350, image: "/images/profile.png" },
      { name: "Jordan", points: 300, image: "/images/profile.png" },
    ];

    // Fun facts array
    const funFacts = [
      `You've walked the height of Mount Everest ${(totalMiles / 5.5).toFixed(2)}x times!`,
      `You've walked the length of the Golden Gate Bridge ${(totalMiles / 1.7).toFixed(1)}x times!`,
      `You've walked from LA to San Diego ${(totalMiles / 120).toFixed(2)}x times!`,
      `You've walked the length of Central Park ${(totalMiles / 2.5).toFixed(1)}x times!`,
      `Estimated calories burned: ${Math.round(totalMiles * 100).toLocaleString()} kcal`,
    ];

    return (
      <div className="fixed inset-0 z-[2300] flex flex-col items-center justify-center bg-[#f5f7fa]">
        {/* Blurred background content */}
        <div className="absolute inset-0 blur-sm opacity-30 pointer-events-none">
          <div className="flex h-[calc(100vh-80px)]">
            <div className="flex-1 relative pr-80 bg-gray-200">{/* Simplified map background */}</div>
            <div className="w-80 bg-white shadow-lg overflow-y-auto h-full fixed right-0 top-16">
              <div className="p-6 pb-20">
                <h2 className="text-2xl font-bold text-[#4a90e2] mb-4">Pathpal Explorer</h2>
              </div>
            </div>
          </div>
        </div>
        {/* Modal content */}
        <div className="relative z-[2400] bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
          {/* Celebration Icon */}
          <div className="text-6xl mb-4">🎉</div>
          {/* Congratulations Message */}
          <h1 className="text-3xl font-bold text-[#4a90e2] text-center mb-2">
            Congratulations!
          </h1>
          <p className="text-lg text-[#3a4a5d] text-center mb-6">
            You've completed your adventure!
          </p>
          {/* Stats Cards */}
          <div className="w-full space-y-4 mb-6">
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#FF6B6B'}}>
              <div className="text-2xl font-bold">{completionStats.points}</div>
              <div className="text-sm opacity-90">Points Earned</div>
            </div>
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#4ECDC4'}}>
              <div className="text-2xl font-bold">{routeBusinesses.length}</div>
              <div className="text-sm opacity-90">Locations</div>
            </div>
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#45B7D1'}}>
              <div className="text-2xl font-bold">{completionStats.distance.toFixed(1)}</div>
              <div className="text-sm opacity-90">Miles Walked</div>
            </div>
            <div className="rounded-lg p-4 text-white text-center" style={{backgroundColor: '#96CEB4'}}>
              <div className="text-2xl font-bold">{formatTime(completionStats.timeElapsed)}</div>
              <div className="text-sm opacity-90">Time Elapsed</div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={() => {
                setShowCompletionModal(false);
                setAdventureStarted(false);
                setSelectedRoute(null);
                setVisitedLocations(new Set());
                setTotalPoints(0);
                setAdventureStartTime(null);
              }}
              className="w-full py-3 bg-[#4a90e2] text-white rounded-lg font-semibold hover:bg-[#357ab8] transition"
            >
              Start New Adventure
            </button>
            <Link href="/stats">
              <button className="w-full py-3 bg-[#f5a623] text-white rounded-lg font-semibold hover:bg-[#e94e77] transition">
                View Stats
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
 
  // Main dashboard
  return <DashboardContent />;
}