import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchBiodiversity.css";

const SearchBiodiversity = ({ onSelect = () => {} }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!query) {
      setResults([]);
      return;
    }
    fetch("https://netzero-vigrow-api.duckdns.org/iter2/species/animals")
      .then((res) => res.json())
      .then((data) => {
        const q = query.toLowerCase();
        const filtered = data.filter((item) => {
          const sci = (item.animal_taxon_name || "").toLowerCase();
          const com = (item.vernacular_name || "").toLowerCase();

          if (q.length === 1) {
            return sci.startsWith(q) || com.startsWith(q);
          }
          return sci.includes(q) || com.includes(q);
        });
        setResults(filtered);
      })
      .catch((err) => console.error("Error fetching animals:", err));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="explore-wrapper">
      <h2 className="explore-title">Explore more</h2>
      <p className="explore-subtitle">
        Use the search and filter below to discover plants, pollinators, pests,
        and endangered species.
      </p>

      <div className="explore-section">
        {/* 搜索框 */}
        <div className="explore-search-box">
          {/* 🔹 已移除左侧 Type 按钮 */}
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
            />
          </div>
          <button className="search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        {/* 搜索结果展示 */}
        <div className="explore-results">
          {results.map((item, idx) => (
            <div
              className="explore-card"
              key={idx}
              style={{ cursor: "default" }}
            >
              <img
                src={item.image_url}
                alt={item.animal_taxon_name}
                className="explore-img"
              />
              <div className="explore-info">
                <h3 className="explore-name">
                  {item.vernacular_name || item.animal_taxon_name}
                </h3>
                <p className="explore-latin">
                  <i>{item.animal_taxon_name}</i>
                </p>
                <p className="explore-views">👁 {item.number_of_records}</p>
                {/* Explore more 链接 */}
                <p
                  className="explore-more-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/animal/${encodeURIComponent(item.animal_taxon_name)}`);
                  }}
                >
                  Explore more →
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="explore-count">{results.length} results</p>
      </div>
    </div>
  );
};

export default SearchBiodiversity;
