import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SearchBiodiversity.css";

const SS_Q = "bio.search.q";         // 会话内保存的查询词
const SS_RESULTS = "bio.search.res"; // 会话内保存的查询结果（字符串化）

const SearchBiodiversity = ({ onSelect = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const isInitialMount = useRef(true);

  const runFilter = (all, q) => {
    if (!Array.isArray(all)) return [];
    const qq = (q || "").toLowerCase();
    return all.filter((item) => {
      const sci = (item.animal_taxon_name || "").toLowerCase();
      const com = (item.vernacular_name || "").toLowerCase();
      if (qq.length === 1) return sci.startsWith(qq) || com.startsWith(qq);
      return sci.includes(qq) || com.includes(qq);
    });
  };

  const fetchAndFilter = async (q) => {
    if (!q) {
      setResults([]);
      sessionStorage.removeItem(SS_RESULTS);
      return;
    }
    try {
      const res = await fetch("https://netzero-vigrow-api.duckdns.org/iter2/species/animals");
      const data = await res.json();
      const filtered = runFilter(data, q);
      setResults(filtered);
      sessionStorage.setItem(SS_RESULTS, JSON.stringify(filtered));
    } catch (e) {
      console.error("Error fetching animals:", e);
    }
  };

  const setURLQuery = (q, replace = false) => {
    const search = q ? `?q=${encodeURIComponent(q)}` : "";
    navigate({ pathname: location.pathname, search }, { replace });
  };

  const handleSearch = () => {
    const q = (query || "").trim();
    if (!q) {
      setResults([]);
      sessionStorage.removeItem(SS_Q);
      sessionStorage.removeItem(SS_RESULTS);
      setURLQuery("", false);
      return;
    }
    sessionStorage.setItem(SS_Q, q);
    fetchAndFilter(q);
    setURLQuery(q, false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // 仅在浏览器刷新时清空
  useEffect(() => {
    const navEntry = window.performance?.getEntriesByType?.("navigation")?.[0];
    const isReload = navEntry?.type === "reload" || window.performance?.navigation?.type === 1;
    if (isReload) {
      sessionStorage.removeItem(SS_Q);
      sessionStorage.removeItem(SS_RESULTS);
      setQuery("");
      setResults([]);
      setURLQuery("", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 状态恢复逻辑（初始化和URL变化时）
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qFromURL = params.get("q") || "";
    const qFromSS = sessionStorage.getItem(SS_Q) || "";
    const resFromSSStr = sessionStorage.getItem(SS_RESULTS);

    // 优先使用 sessionStorage，其次使用 URL 参数
    const effectiveQ = qFromSS || qFromURL;

    // 如果是初始挂载或从详情页返回，强制恢复状态
    if (effectiveQ) {
      // 同步查询框
      setQuery(effectiveQ);
      
      // 恢复结果
      if (resFromSSStr) {
        try {
          const cached = JSON.parse(resFromSSStr);
          if (Array.isArray(cached)) {
            setResults(cached);
          } else {
            fetchAndFilter(effectiveQ);
          }
        } catch {
          fetchAndFilter(effectiveQ);
        }
      } else {
        fetchAndFilter(effectiveQ);
      }

      // 确保 URL 和 sessionStorage 同步
      if (!qFromURL && qFromSS) {
        setURLQuery(qFromSS, true);
      }
      if (qFromURL && !qFromSS) {
        sessionStorage.setItem(SS_Q, qFromURL);
      }
    } else {
      // 没有任何查询时，清空状态
      setQuery("");
      setResults([]);
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.pathname]);

  return (
    <div className="explore-wrapper">
      <h2 className="explore-title">Explore more</h2>
      <p className="explore-subtitle">
        Use the search and filter below to discover plants, pollinators, pests,
        and endangered species.
      </p>

      <div className="explore-section">
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
              autoComplete="off"
            />
          </div>
          <button className="search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        <div className="explore-results">
          {results.map((item, idx) => {
            const hasCommon =
              typeof item.vernacular_name === "string" &&
              item.vernacular_name.trim().length > 0 &&
              item.vernacular_name.toLowerCase() !== "nan";

            return (
              <div className="explore-card" key={idx} style={{ cursor: "default" }}>
                <img
                  src={item.image_url}
                  alt={item.animal_taxon_name}
                  className="explore-img"
                />
                <div className="explore-info">
                  <h3 className="explore-name">
                    {hasCommon ? item.vernacular_name : item.animal_taxon_name}
                  </h3>

                  {hasCommon && (
                    <p className="explore-latin">
                      <i>{item.animal_taxon_name}</i>
                    </p>
                  )}

                  <p className="explore-views">👁 {item.number_of_records}</p>

                  <p
                    className="explore-more-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentQ = query.trim();
                      // 在跳转前确保 sessionStorage 保存了当前状态
                      if (currentQ) {
                        sessionStorage.setItem(SS_Q, currentQ);
                        sessionStorage.setItem(SS_RESULTS, JSON.stringify(results));
                      }
                      navigate(
                        `/animal/${encodeURIComponent(item.animal_taxon_name)}${
                          currentQ ? `?q=${encodeURIComponent(currentQ)}` : ""
                        }`
                      );
                    }}
                  >
                    Explore more →
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="explore-count">{results.length} results</p>
      </div>
    </div>
  );
};

export default SearchBiodiversity;