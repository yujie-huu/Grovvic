import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SearchBiodiversity.css";

const SearchBiodiversity = ({ onSelect = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // get q from url
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);

  const runFilter = (all, q) => {
    const qq = q.toLowerCase();
    return all.filter((item) => {
      const sci = (item.animal_taxon_name || "").toLowerCase();
      const com = (item.vernacular_name || "").toLowerCase();
      if (qq.length === 1) {
        return sci.startsWith(qq) || com.startsWith(qq);
      }
      return sci.includes(qq) || com.includes(qq);
    });
  };

  const handleSearch = () => {
    if (!query) {
      setResults([]);
      // 清空时，移除 URL 的 q
      navigate({ pathname: location.pathname }, { replace: true });
      return;
    }
    fetch("https://netzero-vigrow-api.duckdns.org/iter2/species/animals")
      .then((res) => res.json())
      .then((data) => {
        setResults(runFilter(data, query));
        // 把 q 写回当前路径（不会跳到其它页面）
        navigate(
          { pathname: location.pathname, search: `?q=${encodeURIComponent(query)}` },
          { replace: true }
        );
      })
      .catch((err) => console.error("Error fetching animals:", err));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // 当 URL 的 q 变化时，自动恢复搜索结果
  useEffect(() => {
    // 与本地状态不同步时，先同步输入框
    if (initialQuery !== query) setQuery(initialQuery);

    if (!initialQuery) {
      setResults([]);
      return;
    }
    // 用 URL 中的 q 触发一次搜索，恢复结果
    fetch("https://netzero-vigrow-api.duckdns.org/iter2/species/animals")
      .then((res) => res.json())
      .then((data) => setResults(runFilter(data, initialQuery)))
      .catch((err) => console.error("Error fetching animals:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]); // 仅在 URL 的 q 变更时运行

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
            <div className="explore-card" key={idx} style={{ cursor: "default" }}>
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
                {/* Explore more：把当前 q 一并带过去（返回更易恢复） */}
                <p
                  className="explore-more-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/animal/${encodeURIComponent(item.animal_taxon_name)}${
                        query ? `?q=${encodeURIComponent(query)}` : ""
                      }`
                    );
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
