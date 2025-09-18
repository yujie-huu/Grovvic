import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Biodiversity.css";
import "./BiodiversityExplore.css";

const Biodiversity = () => {
  const [selectedCategory, setSelectedCategory] = useState("Endangered Animals");
  const [mapType, setMapType] = useState("Minimal");
  const [search, setSearch] = useState("Acridotheres tristis");
  const [occurrences, setOccurrences] = useState([]);

  // 请求后端 API 获取物种分布数据
  useEffect(() => {
    if (!search) return;
    const url = `https://netzero-vigrow-api.duckdns.org/iter2/occurrences/by-animal?animal=${encodeURIComponent(
      search
    )}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setOccurrences(data);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, [search]);

  const getTileLayer = () => {
    switch (mapType) {
      case "Road":
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      case "Terrain":
        return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      case "Satellite":
        return "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";
      default:
        return "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
    }
  };

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
            {[
              "Endangered Animals",
              "Pollinators",
              "Pests and Weeds",
            ].map((cat) => (
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
            {["All", "Waterfowls", "Cranes, rails, allies", "Parrots, cockatoos, lorikeets", "Butterflies, moths", "etc"].map((group) => (
              <label key={group}>
                <input type="checkbox" /> {group}
              </label>
            ))}
          </div>
        </div>

        {/* 右侧地图区域 */}
        <div className="map-container">
          <div className="map-header">
            <span>28 Dec 2000 – 10 Jan 2025 ▼</span>
          </div>
          <MapContainer center={[-37.8, 145]} zoom={7} style={{ height: "400px", width: "100%" }}>
            <TileLayer url={getTileLayer()} />
            {occurrences.map((item, idx) => (
              <CircleMarker
                key={idx}
                center={[item.decimalLatitude, item.decimalLongitude]}
                radius={5}
                color="red"
                fillOpacity={0.7}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                  {new Date(item.eventDate).toLocaleDateString()}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* 地图类型切换 */}
          <div className="map-type-selector">
            {["Minimal", "Road", "Terrain", "Satellite"].map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="mapType"
                  checked={mapType === type}
                  onChange={() => setMapType(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Biodiversity;
