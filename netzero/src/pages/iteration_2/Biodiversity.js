import React, { useState } from "react";
import "./Biodiversity.css";
import "./BiodiversityExplore.css";

const Biodiversity = () => {
  const [selectedCategory, setSelectedCategory] = useState("Endangered Animals");
  const [mapType, setMapType] = useState("Minimal");
  const [search, setSearch] = useState("");

  const mockResults = [
    {
      id: 1,
      name: "Spiny-cheeked Honeyeater",
      latin: "Acanthagenys rufogularis",
      related: "Related to 4 plants",
      views: "39,284",
      image: "/images/bird1.jpg",
    },
    {
      id: 2,
      name: "Yellow-rumped Thornbill",
      latin: "Acanthiza chrysorrhoa",
      related: "Related to 3 plants",
      views: "96,066",
      image: "/images/bird2.jpg",
    },
    {
      id: 3,
      name: "Red-rumped Tit",
      latin: "Acanthiza apicalis",
      related: "Related to 3 plants",
      views: "6,883",
      image: "/images/bird3.jpg",
    },
  ];

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
          <div className="map-placeholder">
            <p>[ Map Placeholder – {mapType} View ]</p>
          </div>

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

      {/* ✅ 只保留绿色背景 Explore 部分 */}
      <div className="explore-wrapper">
        <div className="explore-section">
          <h2 className="explore-title">Explore more</h2>
          <p className="explore-subtitle">
            Use the search and filter below to discover plants, pollinators, pests,
            and endangered species.
          </p>

          <div className="explore-search-box">
            <button className="filter-btn">Type</button>
            <input
              type="text"
              className="search-input"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="search-btn">Search</button>
          </div>

          <div className="tag-box">Endangered Birds ✕</div>

          <div className="explore-results">
            {mockResults.map((item) => (
              <div className="explore-card" key={item.id}>
                <img src={item.image} alt={item.name} className="explore-img" />
                <div className="explore-info">
                  <h3 className="explore-name">{item.name}</h3>
                  <p className="explore-latin">{item.latin}</p>
                  <p className="explore-related">{item.related}</p>
                  <p className="explore-views">👁 {item.views}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="explore-count">{mockResults.length} results</p>
        </div>
      </div>
    </div>
  );
};

export default Biodiversity;
