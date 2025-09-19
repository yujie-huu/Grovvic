import React, { useState } from "react";
import "./SearchBiodiversity.css";

const SearchBiodiversity = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    if (!query) {
      setResults([]); // 没有输入就清空
      return;
    }
    fetch("https://netzero-vigrow-api.duckdns.org/iter2/species/animals")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((item) =>
          item.animal_taxon_name.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      })
      .catch((err) => console.error("Error fetching animals:", err));
  };

  return (
    <div className="explore-wrapper">
      <h2 className="explore-title">Explore more</h2>
      <p className="explore-subtitle">
        Use the search and filter below to discover plants, pollinators, pests,
        and endangered species.
      </p>

      <div className="explore-section">
        {/* ✅ 搜索框 */}
        <div className="explore-search-box">
          <button className="filter-btn">Type</button>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(); // ✅ 按下 Enter 就执行搜索
                }
              }}
              className="search-input"
            />
          </div>
          <button className="search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        {/* ✅ 搜索结果展示（保持原来的卡片风格） */}
        <div className="explore-results">
          {results.map((item, idx) => (
            <div className="explore-card" key={idx}>
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
