// src/pages/iteration_2/AnimalDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polygon, GeoJSON } from "react-leaflet";
import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";
import "./AnimalDetail.css";
import { MdArrowBack } from "react-icons/md";

const AnimalDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [occurrences, setOccurrences] = useState([]);
  const [polygonBounds, setPolygonBounds] = useState(null);

  // Related plants（已做“按 plant_scientific_name 合并”）
  const [relations, setRelations] = useState([]);

  // Victoria 边界（从 public/data/victoria_fixed.geojson 加载）
  const [vicBoundary, setVicBoundary] = useState(null);

  // 交互类型映射（关键词 -> 可读句子）
  const INTERACTION_MAP = {
    eatenBy: "It eats this plant.",
    hasParasite: "It is a parasite for this plant.",
    hasHost: "It is hosted by this plant.",
    visitedBy: "It visits this plant.",
    hasPathogen: "It infects this plant.",
    hasEggsLayedOnBy: "It lays eggs on this plant.",
    pollinatedBy: "It pollinates this plant.",
  };

  const formatInteraction = (raw) => {
    if (!raw) return "";

    const cleaned = String(raw)
      .trim()
      .replace(/\(.*?\)/g, "") // 去掉括号
      .replace(/[^a-zA-Z]/g, "") // 去掉非字母字符
      .toLowerCase();

    // 1️⃣ 原始精确匹配
    for (const [key, val] of Object.entries(INTERACTION_MAP)) {
      if (key.toLowerCase() === cleaned) {
        return val;
      }
    }

    // 2️⃣ 模糊匹配（关键词包含）
    const lower = raw.toLowerCase();
    if (lower.includes("visit")) return INTERACTION_MAP.visitedBy;
    if (lower.includes("pollinat")) return INTERACTION_MAP.pollinatedBy;
    if (lower.includes("host")) return INTERACTION_MAP.hasHost;
    if (lower.includes("parasite")) return INTERACTION_MAP.hasParasite;
    if (lower.includes("pathogen")) return INTERACTION_MAP.hasPathogen;
    if (lower.includes("egg")) return INTERACTION_MAP.hasEggsLayedOnBy;
    if (lower.includes("eat")) return INTERACTION_MAP.eatenBy;

    // 3️⃣ 未匹配则原样返回（保持你原逻辑）
    return raw.trim();
  };

  // ✅ 将一组交互映射后去重
  const mapAndDedupeInteractions = (arr = []) => {
    const result = [];
    arr.forEach((item) => {
      const formatted = formatInteraction(item);
      if (formatted && !result.includes(formatted)) {
        result.push(formatted);
      }
    });
    return result;
  };

  // 获取动物信息 & 分布信息
  useEffect(() => {
    if (!name) return;

    // 获取动物详细信息
    const url = `https://netzero-vigrow-api.duckdns.org/iter2/species/animal/${encodeURIComponent(
      name
    )}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAnimal(data))
      .catch((err) => console.error("Error fetching animal detail:", err));

    // 获取分布信息
    const occUrl = `https://netzero-vigrow-api.duckdns.org/iter2/occurrences/by-animal?animal=${encodeURIComponent(
      name
    )}`;
    fetch(occUrl)
      .then((res) => res.json())
      .then((data) => {
        setOccurrences(data);

        if (data.length === 1) {
          // 1 点：10km 缓冲圆
          const point = turf.point([data[0].decimalLongitude, data[0].decimalLatitude]);
          const buffer = turf.buffer(point, 10, { units: "kilometers" });
          if (buffer) {
            const coords = buffer.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
            setPolygonBounds(coords);
          }
        } else if (data.length === 2) {
          // 2 点：包围盒
          const line = turf.lineString(data.map((d) => [d.decimalLongitude, d.decimalLatitude]));
          const bboxPoly = turf.bboxPolygon(turf.bbox(line));
          if (bboxPoly) {
            const coords = bboxPoly.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
            setPolygonBounds(coords);
          }
        } else if (data.length > 2) {
          // ≥3 点：凸包
          const points = turf.featureCollection(
            data.map((d) => turf.point([d.decimalLongitude, d.decimalLatitude]))
          );
          const hull = turf.convex(points);
          if (hull) {
            const coords = hull.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
            setPolygonBounds(coords);
          }
        }
      })
      .catch((err) => console.error("Error fetching occurrences:", err));
  }, [name]);

  // 获取相关植物（按 plant_scientific_name 合并）
  useEffect(() => {
    if (!name) return;

    const relUrl = `https://netzero-vigrow-api.duckdns.org/iter2/relations/by-animal?animal=${encodeURIComponent(
      name
    )}`;

    fetch(relUrl)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];

        const map = new Map();
        list.forEach((rel) => {
          const key = (rel.plant_scientific_name || "").trim();
          if (!key) return;

          if (!map.has(key)) {
            // ✅ 把 plant_common_name 一起存进去
            map.set(key, {
              plant_scientific_name: key,
              plant_common_name: (rel.plant_common_name || "").trim(), // <—— 新增
              vernacular_name: rel.vernacular_name || rel.plant_scientific_name || "",
              plant_image_url: rel.plant_image_url || "",
              interactions: [],
            });
          }

          const entry = map.get(key);

          // ✅ 保留第一个非空的 common name（如果之前没存到）
          if (!entry.plant_common_name && rel.plant_common_name) {
            entry.plant_common_name = rel.plant_common_name.trim();
          }

          if (!entry.vernacular_name && (rel.vernacular_name || rel.plant_scientific_name)) {
            entry.vernacular_name = rel.vernacular_name || rel.plant_scientific_name;
          }

          if (!entry.plant_image_url && rel.plant_image_url) {
            entry.plant_image_url = rel.plant_image_url;
          }

          const it = (rel.interaction_type_raw || "").trim();
          if (it && !entry.interactions.includes(it)) entry.interactions.push(it);
        });

        const merged = Array.from(map.values());
        setRelations(merged);

        // 可选：调试看看是否有 common name
        // console.log("relations sample:", merged.slice(0, 5));
      })
      .catch((err) => console.error("Error fetching relations:", err));
  }, [name]);


  // 从 public 目录加载 Victoria 边界 GeoJSON
  useEffect(() => {
    fetch("/data/victoria_fixed.geojson") // 确保文件位于 public/data/victoria_fixed.geojson
      .then((res) => res.json())
      .then(setVicBoundary)
      .catch((err) => console.error("Error loading Victoria boundary:", err));
  }, []);

  if (!animal) return <p>No animals.</p>;

  // 维州固定边界（用于锁死视图）
  const VIC_BOUNDS = [
    [-39.2, 140.8], // 西南角
    [-33.8, 150.1], // 东北角
  ];

  return (
    <div className="animal-detail-page">
      {/* Header Section */}
      <header className="animal-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <MdArrowBack />
        </button>
        
        <div className="animal-title-section">
          <h1 className="animal-vernacular-name">
            {animal.vernacular_name || animal.animal_taxon_name}
          </h1>
          <div className="animal-scientific-info">
            <span className="scientific-name">
              <i>{animal.animal_taxon_name}</i>
            </span>
            <span className="family-name">{animal.family}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="animal-main-content">
        {/* Hero Section with Image and Description */}
        <section className="animal-hero-section">
          <div className="animal-image-container">
            <img
              src={animal.image_url}
              alt={animal.animal_taxon_name}
              className="animal-hero-image"
            />
          </div>
          
          <div className="animal-description-container">
            <h2 className="animal-description-title">About This Species</h2>
            <div className="animal-description-content">
              <p>{animal.summary}</p>
            </div>
          </div>
        </section>

        {/* Distribution Maps Section */}
        <section className="animal-distribution-section">
          <h2 className="animal-section-title">Distribution & Occurrence</h2>
          
          <div className="animal-maps-grid">
            {/* Compiled Distribution Map */}
            {polygonBounds && (
              <div className="animal-map-card">
                <div className="animal-map-header">
                  <h3 className="animal-map-title">Distribution Range</h3>
                  <p className="animal-map-subtitle">Compiled distribution area</p>
                </div>
                
                <div className="animal-map-container">
                  <MapContainer
                    bounds={VIC_BOUNDS}
                    maxBounds={VIC_BOUNDS}
                    maxBoundsViscosity={1.0}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                    boxZoom={false}
                    keyboard={false}
                    dragging={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
                    
                    {vicBoundary && (
                      <GeoJSON
                        data={vicBoundary}
                        style={{ color: "#3b82f6", weight: 2, fillOpacity: 0.1 }}
                      />
                    )}
                    
                    <Polygon
                      positions={polygonBounds}
                      pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.6 }}
                    />
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Occurrence Records Map */}
            <div className="animal-map-card">
              <div className="animal-map-header">
                <h3 className="animal-map-title">Occurrence Records</h3>
                <p className="animal-map-subtitle">Individual sighting locations</p>
              </div>
              
              <div className="animal-map-container">
                <MapContainer 
                  center={[-25, 133]} 
                  zoom={3} 
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
                  />
                  {occurrences.map((item, idx) => (
                    <CircleMarker
                      key={idx}
                      center={[item.decimalLatitude, item.decimalLongitude]}
                      radius={6}
                      color="#3b82f6"
                      fillColor="#3b82f6"
                      fillOpacity={0.8}
                      weight={2}
                    >
                      <Tooltip>
                        <div className="animal-tooltip-content">
                          <strong>Date:</strong> {item.eventDate}
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Related Plants Section */}
        {Array.isArray(relations) && relations.length > 0 && (
          <section className="animal-related-plants-section">
            <div className="animal-section-header">
              <h2 className="animal-section-title">Related Plants</h2>
              <p className="animal-section-subtitle">Plants that interact with this species</p>
            </div>
            
            <div className="animal-plants-grid">
              {relations.map((rel, idx) => {
                const displayName =
                  (rel.plant_common_name && rel.plant_common_name.trim()) ||
                  (rel.plant_scientific_name && rel.plant_scientific_name.trim()) ||
                  "Unknown Plant";

                return (
                  <article className="animal-plant-card" key={idx}>
                    <div className="animal-animal-plant-image-container">
                      {rel.plant_image_url ? (
                        <img
                          src={rel.plant_image_url}
                          alt={displayName}
                          className="animal-plant-image"
                        />
                      ) : (
                        <div className="animal-animal-plant-image-placeholder">
                          <span>No Image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="animal-plant-info">
                      <h3 className="animal-plant-name">{displayName}</h3>
                      
                      <div className="animal-interactions-container">
                        {rel.interactions && rel.interactions.length > 0 ? (
                          <ul className="animal-interactions-list">
                            {mapAndDedupeInteractions(rel.interactions).map((interaction, i) => (
                              <li className="animal-interaction-item" key={i}>
                                {interaction}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="animal-no-interactions">No interaction data available</p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AnimalDetail;
