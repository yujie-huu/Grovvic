import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Biodiversity.css";
import "./SearchBiodiversity.css";
import SearchBiodiversity from "./SearchBiodiversity";

const Biodiversity = () => {
  const [selectedCategory, setSelectedCategory] = useState("Endangered Animals");
  const [search, setSearch] = useState("Acridotheres tristis");
  const [groupedOccurrences, setGroupedOccurrences] = useState([]);

  // API call to fetch and group occurrences by lat/lng
  useEffect(() => {
    if (!search) return;
    const url = `https://netzero-vigrow-api.duckdns.org/iter2/occurrences/by-animal?animal=${encodeURIComponent(
      search
    )}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const groups = {};
        data.forEach((item) => {
          const key = `${item.decimalLatitude},${item.decimalLongitude}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(new Date(item.eventDate));
        });

        const results = Object.entries(groups).map(([key, dates]) => {
          const [lat, lng] = key.split(",").map(Number);
          const minDate = new Date(Math.min(...dates));
          const maxDate = new Date(Math.max(...dates));

          const formatDate = (d) =>
            d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

          return {
            lat,
            lng,
            dateRange: `${formatDate(minDate)} – ${formatDate(maxDate)}`,
          };
        });

        setGroupedOccurrences(results);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, [search]);

  return (
    <div className="biodiversity-page">
      <h1>Biodiversity in Victoria</h1>
      <p>
        Filter by category and hover over map dots to highlight species with total observations.
      </p>

      <div className="biodiversity-container">
        {/* 左侧过滤栏 */}
        <div className="filter-panel">
          <h3>Which local organisms do you want to see?</h3>
          <div className="category-buttons">
            {["Endangered Animals", "Pollinators", "Pests and Weeds"].map((cat) => (
              <button
                key={cat}
                className={`category-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <h3>Filter by animal group:</h3>
          <div className="checkbox-list">
            {[
              "All",
              "Waterfowls",
              "Cranes, rails, allies",
              "Parrots, cockatoos, lorikeets",
              "Butterflies, moths",
              "etc",
            ].map((group) => (
              <label key={group}>
                <input type="checkbox" /> {group}
              </label>
            ))}
          </div>
        </div>

        {/* 右侧地图区域 */}
        <div className="map-container">
          <MapContainer
            center={[-37.8, 145]}
            zoom={7}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
            {groupedOccurrences.map((item, idx) => (
              <CircleMarker
                key={idx}
                center={[item.lat, item.lng]}
                radius={5}
                color="red"
                fillOpacity={0.7}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                  {item.dateRange}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* 🔹修改：在地图下方加入搜索 Explore 部分 */}
      <SearchBiodiversity onSelect={(animalName) => setSearch(animalName)} />
    </div>
  );
};

export default Biodiversity;
