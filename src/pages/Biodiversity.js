import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Biodiversity.css";
import "./SearchBiodiversity.css";
import SearchBiodiversity from "./SearchBiodiversity";

const Biodiversity = () => {
  const [selectedCategory, setSelectedCategory] = useState("Endangered Animals");
  const [search, setSearch] = useState("");

  // ✅ 改为直接保存原始发生记录，不做分组与时间范围计算
  const [occurrences, setOccurrences] = useState([]);

  // API call to fetch and group occurrences by lat/lng
  useEffect(() => {
    if (!search) return;
    const url = `https://netzero-vigrow-api.duckdns.org/iter2/occurrences/by-animal?animal=${encodeURIComponent(
      search
    )}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setOccurrences(Array.isArray(data) ? data : []);
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
            {occurrences.map((item, idx) => (
              <CircleMarker
                key={`${idx}-${item.decimalLatitude}-${item.decimalLongitude}-${item.eventDate}`}
                center={[item.decimalLatitude, item.decimalLongitude]}
                radius={5}
                color="red"
                fillOpacity={0.7}
              >
                {/* ✅ 只显示原始时间，不再做任何处理 */}
                <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                  {item.eventDate}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* 地图下方的搜索区，点击小卡片仍然会更新上方地图物种 */}
      <SearchBiodiversity onSelect={(animalName) => setSearch(animalName)} />
    </div>
  );
};

export default Biodiversity;
