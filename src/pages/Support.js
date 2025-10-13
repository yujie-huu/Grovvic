import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "./Support.css";
import DiagnosisWizard from "../components/DiagnosisWizard";
import diagnosisData from "../data/US5.2_Data_final_nested_fixed.json";
import 'leaflet/dist/leaflet.css';

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 地图视图更新组件
function MapViewController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, {
        duration: 1.5
      });
    }
  }, [center, zoom, map]);
  
  return null;
}

const Support = () => {
  const [parsedData, setParsedData] = useState([]);
  const [openSection, setOpenSection] = useState(null);
  const [openQuestion, setOpenQuestion] = useState({});
  const [communityData, setCommunityData] = useState([]);

  // 搜索输入值（仅在回车时进行搜索）
  const [searchTerm, setSearchTerm] = useState("");

  // 每个问题节点的引用，用于回车搜索后滚动定位
  const questionRefs = useRef({}); // key: `${sIdx}-${qIdx}` -> HTMLElement
  const pendingScrollKeyRef = useRef(null); // 等待渲染后滚动的目标

  // 社区横滑相关
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });
  const trackRef = useRef(null);

  // 地图相关状态
  const [gardens, setGardens] = useState([]);
  const [gardenSearchTerm, setGardenSearchTerm] = useState("");
  const [selectedGarden, setSelectedGarden] = useState(null);
  const [mapCenter, setMapCenter] = useState([-37.8136, 144.9631]); // 维多利亚州中心
  const [mapZoom, setMapZoom] = useState(7);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchConfirmed, setIsSearchConfirmed] = useState(false); // 标记是否已确认搜索
  const [lastConfirmedTerm, setLastConfirmedTerm] = useState(""); // 记录最后一次确认的搜索词

  const imageMap = {
    "Hume City Council – Community Gardens": "/images/support_community_1.png",
    "Cultivating Community": "/images/support_community_2.webp",
    "Open Gardens Victoria": "/images/support_community_3.png",
    "Community Gardens Australia (ACFCGN)": "/images/support_community_4.jpg",
    "Gardens for Wildlife Victoria": "/images/support_community_5.png",
  };

  // 并行加载并解析 markdown
  useEffect(() => {
    const parseFAQ = (text) => {
      const lines = text.split("\n");
      const data = [];
      let curSec = null, curQ = null;
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith("## ")) {
          curSec = { section: line.slice(3).trim(), items: [] };
          data.push(curSec);
        } else if (line.startsWith("### ")) {
          curQ = { q: line.slice(4).trim(), a: [] };
          curSec?.items.push(curQ);
        } else if (/^\d+\./.test(line)) {
          curQ?.a.push(line.replace(/^\d+\.\s*/, "").trim());
        }
      }
      return data;
    };

    const parseCommunities = (text) =>
      text
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)
        .map((block) => {
          const lines = block.split("\n").filter(Boolean);
          const title = (lines[0] || "").replace(/^#+\s*/, "").trim();
          let url = (lines[1] || "").trim();
          const m = url.match(/\((https?:\/\/[^\s)]+)\)/);
          url = m ? m[1] : url;
          if (url && !/^https?:\/\//.test(url)) url = "https://" + url;
          const desc = lines.slice(2).join(" ").trim();
          return { title, url, desc, img: imageMap[title] || "/images/default.png" };
        });

    Promise.all([fetch("/faq/faq.md"), fetch("/community/community.md")])
      .then(([f1, f2]) => Promise.all([f1.text(), f2.text()]))
      .then(([faqText, communityText]) => {
        setParsedData(parseFAQ(faqText));
        setCommunityData(parseCommunities(communityText));
      })
      .catch((e) => console.error("Load markdown failed:", e));
  }, []);

  // 加载社区花园数据
  useEffect(() => {
    fetch("https://netzero-vigrow-api.duckdns.org/iter3/community/gardens")
      .then((res) => res.json())
      .then((data) => setGardens(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load gardens:", err));
  }, []);

  const toggleSection = (idx) => setOpenSection((s) => (s === idx ? null : idx));
  const toggleQuestion = (sIdx, qIdx) =>
    setOpenQuestion((prev) => ({ ...prev, [sIdx]: prev[sIdx] === qIdx ? null : qIdx }));

  // —— 社区横滑拖拽 —— //
  const startDrag = (pageX) => {
    const el = trackRef.current;
    if (!el) return;
    setIsDragging(true);
    const left = el.getBoundingClientRect().left;
    dragState.current = { startX: pageX - left, scrollLeft: el.scrollLeft };
  };
  const moveDrag = (pageX) => {
    const el = trackRef.current;
    if (!isDragging || !el) return;
    const left = el.getBoundingClientRect().left;
    el.scrollLeft = dragState.current.scrollLeft - (pageX - left - dragState.current.startX);
  };
  const endDrag = () => setIsDragging(false);

  const onMouseDown = (e) => startDrag(e.pageX);
  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    moveDrag(e.pageX);
  };
  const onTouchStart = (e) => startDrag(e.touches[0].pageX);
  const onTouchMove = (e) => moveDrag(e.touches[0].pageX);

  // —— 社区横滑滚轮 —— //
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e) => {
      const p = e.target.closest(".local-program-card p");
      if (p && p.scrollHeight > p.clientHeight) {
        const atTop = p.scrollTop === 0;
        const atBottom = p.scrollTop + p.clientHeight >= p.scrollHeight - 1;
        if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) e.preventDefault();
        return;
      }
      e.preventDefault();
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      el.scrollLeft += delta * 3;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // —— 回车搜索：只在按下 Enter 时触发 —— //
  const scoreText = (text, terms) => {
    const t = text.toLowerCase();
    let score = 0;
    terms.forEach((term) => {
      if (!term) return;
      if (t.includes(term)) score += 10;
      if (t.startsWith(term)) score += 3;
      if (new RegExp(`\\b${term}\\b`).test(t)) score += 5;
    });
    return score;
  };

  const findBestMatch = (data, keyword) => {
    const terms = keyword.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return null;

    let best = { sIdx: -1, qIdx: -1, score: 0 };

    data.forEach((sec, sIdx) => {
      sec.items.forEach((item, qIdx) => {
        let s = 0;
        s += scoreText(item.q, terms) * 5;
        item.a.forEach((ans) => (s += scoreText(ans, terms) * 2));
        s += scoreText(sec.section, terms);
        if (s > best.score) best = { sIdx, qIdx, score: s };
      });
    });

    return best.score > 0 ? best : null;
  };

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const keyword = searchTerm.trim();
    if (!keyword || !parsedData.length) return;

    const best = findBestMatch(parsedData, keyword);
    if (!best) return;

    setOpenSection(best.sIdx);
    setOpenQuestion({ [best.sIdx]: best.qIdx });

    const key = `${best.sIdx}-${best.qIdx}`;
    pendingScrollKeyRef.current = key;
  };

  // 渲染后执行滚动定位
  useEffect(() => {
    if (!pendingScrollKeyRef.current) return;
    const key = pendingScrollKeyRef.current;
    const el = questionRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      pendingScrollKeyRef.current = null;
    }
  }, [openSection, openQuestion]);

  // 地图搜索功能
  const handleGardenSearch = () => {
    const term = gardenSearchTerm.trim().toLowerCase();
    
    if (!term) {
      setSearchResults([]);
      setIsSearchConfirmed(false);
      setLastConfirmedTerm("");
      return;
    }

    // 执行搜索并锁定结果
    const matched = gardens.filter((g) => 
      g.name.toLowerCase().includes(term)
    );

    setSearchResults(matched);
    setIsSearchConfirmed(true); // 锁定结果
    setLastConfirmedTerm(term); // 记录确认的搜索词
  };

  useEffect(() => {
    // 如果已确认搜索，不响应输入变化
    if (isSearchConfirmed) return;

    const term = gardenSearchTerm.trim().toLowerCase();
    
    if (!term) {
      setSearchResults([]);
      return;
    }

    // 动态过滤结果
    const matched = gardens.filter((g) => 
      g.name.toLowerCase().includes(term)
    );

    setSearchResults(matched);

  }, [gardenSearchTerm, isSearchConfirmed]);

  const mapRef = useRef(null); 


  return (
    <div className="support-page">
      {/* Hero */}
      <div className="support-hero" style={{ backgroundImage: "url(/images/support_1.jpg)" }}>
        <div className="support-hero-content">
          <h1>
            Find answers. Grow sustainably.
          </h1>
          <p>
            Explore gardening FAQs, troubleshooting tools, and government programs in your region.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <section className="support-section">
        <h2>Frequently Asked Questions</h2>
        <div className="support-faq-grid">
          <ul className="support-links">
            {parsedData.map((sec, sIdx) => (
              <li key={sIdx}>
                <button
                  className={`support-link ${openSection === sIdx ? "is-open" : ""}`}
                  onClick={() => toggleSection(sIdx)}
                >
                  <span className="left">
                    <span className="dot"></span>
                    <span className="text">{sec.section}</span>
                  </span>
                  <span className="chevron"></span>
                </button>

                {openSection === sIdx && (
                  <ul className="faq-questions">
                    {sec.items.map((item, qIdx) => {
                      const isOpen = openQuestion[sIdx] === qIdx;
                      const key = `${sIdx}-${qIdx}`;
                      return (
                        <li
                          key={qIdx}
                          ref={(el) => {
                            if (el) questionRefs.current[key] = el;
                          }}
                        >
                          <button
                            className={`question-link ${isOpen ? "is-open" : ""}`}
                            onClick={() => toggleQuestion(sIdx, qIdx)}
                          >
                            {item.q}
                          </button>

                          {isOpen && (
                            <div className="answer">
                              <ol>
                                {item.a.map((step, i) => (
                                  <li key={i}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <div className="faq-right">
            <img
              src="/images/support_2.jpg"
              alt="FAQ illustration"
              className="faq-side-image"
            />
          </div>
        </div>
      </section>

      {/* Plant Diagnosis Wizard */}
      <section className="diagnosis-section">
        <DiagnosisWizard
          data={diagnosisData}
          onStepDone={({ categoryKey, problemKey }) => {
            console.log("User selected:", categoryKey, problemKey);
          }}
        />
      </section>

      {/* Local Programs */}
      <section className="local-programs-section">
        <div className="local-programs-header">
          <p>DISCOVER MORE</p>
          <h2>LOCAL GOVERNMENT PROGRAMS</h2>
        </div>
        <div className="local-programs-cards">
          {[
            {
              img: "/images/support_local_1.png",
              title: "GARDENS FOR HARVEST",
              desc:
                "A free program offering home-growing guides, seasonal tips, workshops, and community connections to support sustainable food gardening at home—even in small spaces.",
            },
            {
              img: "/images/support_local_2.png",
              title: "GARDENS FOR WILD LIFE VICTORIA",
              desc:
                "A statewide network supporting wildlife-friendly gardens, building skills, partnerships, and community connections through resources and workshops.",
            },
            {
              img: "/images/support_local_3.png",
              title: "MY SMART GARDEN",
              desc:
                "A free program run by partner councils across Melbourne, offering education and support for sustainable home gardening.",
            },
            {
              img: "/images/support_local_4.png",
              title: "VICTORIAN SCHOOLS GARDEN PROGRAM",
              desc:
                "Supports student learning, health, and wellbeing by encouraging schools to use outdoor spaces and build lifelong connections with nature.",
            },
          ].map(({ img, title, desc }, i) => (
            <div className="local-program-card" key={i}>
              <div className="local-program-body">
                <img src={img} alt={title} />
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              <div className="local-program-divider"></div>
              <a href="#" className="local-program-link">
                LEARN MORE
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Local Gardening Communities */}
      <section className="local-communities-section">
        <div className="local-communities-header">
          <h2>LOCAL GARDENING COMMUNITIES</h2>
        </div>
        <div className="local-communities-track">
          {communityData.map((item, idx) => (
            <div className="local-program-card community-card" key={idx}>
              <img src={item.img} alt={item.title} className="community-card-img" />
              <div className="local-program-body">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
              <div className="local-program-divider"></div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="local-program-link"
              >
                LEARN MORE
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Community Garden Map - 覆盖式布局 */}
      <section className="community-garden-map-section">
        {/* 背景图片层 */}
        <div className="map-background-image">
          <img
            src="/images/support_community_map.jpg"
            alt="Local Community Background"
          />
        </div>

        {/* 地图内容层 */}
        <div className="map-content-wrapper">
          <h2>Join Your Local Garden Community</h2>
          
          <div className="map-container-wrapper">
            {/* 👇 新增：左侧侧边栏，仅当有搜索结果且未锁定时显示 */}
            {searchResults.length > 0 && (
              <div className={`sidebar-panel ${isSearchConfirmed ? 'locked' : ''}`}>
                <div className="sidebar-header">

                </div>
                <div className="sidebar-content">
                  {searchResults.map((garden) => (
                    <div
                      key={garden.id}
                      className="sidebar-item"
                      onClick={() => {
                        setSelectedGarden(garden);
                        setMapCenter([garden.lat, garden.lng]);
                        setMapZoom(13);
                      }}
                    >
                      <h4>{garden.name}</h4>
                      <p>{garden.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 搜索栏 - 覆盖在地图顶部 */}
            <div className="garden-search-overlay">
              <div className="garden-search-container">
                <input
                  type="text"
                  placeholder="Search by garden name..."
                  value={gardenSearchTerm}
                  onChange={(e) => {
                    setGardenSearchTerm(e.target.value);
                    // 👇 输入变化时，如果已锁定，解除锁定
                    if (isSearchConfirmed) {
                      setIsSearchConfirmed(false);
                      setLastConfirmedTerm("");
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleGardenSearch()}
                  className="garden-search-input"
                />
                <button onClick={handleGardenSearch} className="garden-search-btn">
                  🔍
                </button>
              </div>
            </div>

            {/* 地图容器 */}
            <MapContainer
              ref={mapRef}
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
              zoomControl={false} // 禁用默认缩放控件
  
            >
              <ZoomControl position='topright' />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapViewController center={mapCenter} zoom={mapZoom} />
              {gardens.map((garden) => (
                <Marker
                  key={garden.id}
                  position={[garden.lat, garden.lng]}
                  eventHandlers={{
                    click: () => {
                      setSelectedGarden(garden);
                      setMapCenter([garden.lat, garden.lng]);
                      setMapZoom(13);
                    }
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: "200px" }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
                        {garden.name}
                      </h3>
                      <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
                        {garden.address}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Support;