'use client';
import Header from "@/components/Header";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function StatsPage() {
  const { user, isSignedIn } = useUser();
  const [city, setCity] = useState("Los Angeles");
  // Mock stats for demo
  const [totalMiles, setTotalMiles] = useState(123.4); // Replace with real data if available
  const [totalMinutes, setTotalMinutes] = useState(2100); // Replace with real data if available
  const [totalPoints, setTotalPoints] = useState(420); // Mock points

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
    { name: "You", points: totalPoints, image: user?.imageUrl || "/images/pin.svg" },
    { name: "Ava", points: 390, image: "/images/profile.png" },
    { name: "Sam", points: 350, image: "/images/profile.png" },
    { name: "Jordan", points: 300, image: "/images/profile.png" },
  ];

  useEffect(() => {
    // Try to get user's current city from geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          const cityName = data.address.city || data.address.town || data.address.village || data.address.neighbourhood || data.address.suburb;
          setCity(cityName || "Los Angeles");
        } catch {
          setCity("Los Angeles");
        }
      });
    }
  }, []);

  // Fun facts array
  const funFacts = [
    `That's like climbing ${(totalMiles / 5.5).toFixed(2)}x Mount Everest!`,
    `Or walking the length of the Golden Gate Bridge ${(totalMiles / 1.7).toFixed(1)}x times!`,
    `Or walking from LA to San Diego ${(totalMiles / 120).toFixed(2)}x times!`,
    `Or walking the length of Central Park ${(totalMiles / 2.5).toFixed(1)}x times!`,
    `Estimated calories burned: ${Math.round(totalMiles * 100).toLocaleString()} kcal`,
  ];
  const [funFact, setFunFact] = useState(funFacts[0]);
  useEffect(() => {
    setFunFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
    // eslint-disable-next-line
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f7fa] flex flex-col items-center py-0 w-full pb-16">
      <Header />
      <div className="flex flex-row w-full max-w-6xl mt-12 gap-8">
        {/* Left sidebar */}
        <aside className="w-80 bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border border-[#dbe4ea]">
          <img
            src={user?.imageUrl || "/images/pin.svg"}
            alt="Profile"
            className="w-24 h-24 rounded-full mb-4 border-4 border-[#4a90e2] object-cover"
          />
          <h1 className="text-3xl font-bold mb-2 text-[#4a90e2] text-center">
            {isSignedIn ? user.fullName || user.username || "Pathpal Explorer" : "Pathpal Explorer"}
          </h1>
          <div className="mb-2 text-[#3a4a5d] text-lg text-center">{city}</div>
          <div className="mb-6 text-[#4a90e2] text-2xl font-bold text-center">Total Points: {totalPoints}</div>
          <div className="w-full flex flex-col gap-4 mb-6">
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-[#3a4a5d]">Total miles walked:</span>
              <span className="font-mono">{totalMiles.toFixed(2)} mi</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-[#3a4a5d]">Total time walked:</span>
              <span className="font-mono">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
            </div>
          </div>
        </aside>
        {/* Right main content */}
        <section className="flex-1 flex flex-col gap-6">
          <div className="w-full bg-[#e6f2ff] rounded p-4 text-center mb-2">
            <div className="text-lg font-semibold text-[#4a90e2] mb-1">Fun Fact</div>
            <div className="text-[#3a4a5d]">{funFact}</div>
          </div>
          {/* Favorite Locations */}
          <div className="w-full bg-[#f5f7fa] rounded p-4">
            <div className="text-lg font-semibold text-[#4a90e2] mb-1">Favorite Locations</div>
            <ul>
              {favoriteBusinesses.map((b) => (
                <li key={b.name} className="flex justify-between text-[#3a4a5d]">
                  <span>{b.name} <span className="text-xs text-[#4a90e2]">({b.city})</span></span>
                  <span className="text-xs">{b.visits} visits</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Leaderboard */}
          <div className="w-full bg-[#e6f2ff] rounded p-4">
            <div className="text-lg font-semibold text-[#4a90e2] mb-1">Leaderboard</div>
            <ul>
              {leaderboard.map((f, i) => (
                <li key={f.name} className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold w-6 text-right">{i + 1}</span>
                  <img src={f.image} alt={f.name} className="w-8 h-8 rounded-full border-2 border-[#4a90e2] object-cover" />
                  <span className="flex-1">{f.name}</span>
                  <span className="font-mono text-[#4a90e2] font-bold">{f.points}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Cities Explored */}
          <div className="w-full bg-[#f5f7fa] rounded p-4">
            <div className="text-lg font-semibold text-[#4a90e2] mb-1">Cities Explored</div>
            <ul className="mb-2">
              {cityVisits.map((c) => (
                <li key={c.name} className="flex justify-between text-[#3a4a5d]">
                  <span>{c.name}</span>
                  <span className="text-xs">Last visit: {new Date(c.lastVisit).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
            <div className="text-[#3a4a5d] mt-2">Favorite city: <span className="font-bold">{favoriteCity.name}</span> ({favoriteCity.count} visits)</div>
          </div>
          <div className="text-[#3a4a5d] text-sm mt-2">More stats and badges coming soon!</div>
        </section>
      </div>
    </main>
  );
} 