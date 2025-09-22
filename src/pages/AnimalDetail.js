// src/pages/iteration_2/AnimalDetail.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polygon } from "react-leaflet";
import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";
import "./AnimalDetail.css";

const AnimalDetail = () => {
  const { name } = useParams();
  const [animal, setAnimal] = useState(null);
  const [occurrences, setOccurrences] = useState([]);
  const [polygonBounds, setPolygonBounds] = useState(null);

  // ✅ Related plants（已做“按 plant_scientific_name 合并”）
  const [relations, setRelations] = useState([]);

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

  // ✅ 获取相关植物信息；按 plant_scientific_name 合并，图片用 plant_image_url，关系逐行展示
  useEffect(() => {
    if (!name) return;

    const relUrl = `https://netzero-vigrow-api.duckdns.org/iter2/relations/by-animal?animal=${encodeURIComponent(
      name
    )}`;

    fetch(relUrl)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];

        // 按 plant_scientific_name 合并
        const map = new Map();
        list.forEach((rel) => {
          const key = (rel.plant_scientific_name || "").trim();
          if (!key) return;

          if (!map.has(key)) {
            map.set(key, {
              plant_scientific_name: key,
              vernacular_name: rel.vernacular_name || rel.plant_scientific_name || "",
              plant_image_url: rel.plant_image_url || "", // 首个有图的条目会保留下来
              interactions: [],
            });
          }

          const entry = map.get(key);

          // 记录更友好的名字（如果还没有）
          if (!entry.vernacular_name && (rel.vernacular_name || rel.plant_scientific_name)) {
            entry.vernacular_name = rel.vernacular_name || rel.plant_scientific_name;
          }

          // 记录首个有效图片
          if (!entry.plant_image_url && rel.plant_image_url) {
            entry.plant_image_url = rel.plant_image_url;
          }

          // 依序收集 interaction_type_raw（去空、按出现顺序去重）
          const it = (rel.interaction_type_raw || "").trim();
          if (it && !entry.interactions.includes(it)) {
            entry.interactions.push(it);
          }
        });

        setRelations(Array.from(map.values()));
      })
      .catch((err) => console.error("Error fetching relations:", err));
  }, [name]);

  if (!animal) return <p>No animals.</p>;

  return (
    <div className="animal-detail">
      <h1 className="animal-vernacular">
        {animal.vernacular_name || animal.animal_taxon_name}
      </h1>
      <p className="animal-scientific">
        <i>{animal.animal_taxon_name}</i> ({animal.genus})
      </p>

      {/* 图片 + 描述 */}
      <div className="animal-detail-content">
        <div className="animal-detail-left">
          <img
            src={animal.image_url}
            alt={animal.animal_taxon_name}
            className="animal-detail-img"
          />
        </div>
        <div className="animal-detail-right">
          <h3 className="animal-desc-title">DESCRIPTION</h3>
          <p className="animal-desc-text">{animal.summary}</p>
        </div>
      </div>

      {/* 两个地图并排显示 */}
      <div className="animal-maps-container">
        {/* 覆盖范围凸包/缓冲/包围盒 */}
        {polygonBounds && (
          <div className="animal-map">
            <h3 className="compiled-map-title">Compiled Distribution Map</h3>
            <MapContainer
              center={[-25, 133]}
              zoom={3}
              style={{ height: "300px", width: "100%" }}
              zoomControl={false}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
              <Polygon
                positions={polygonBounds}
                pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.5 }}
              />
            </MapContainer>
          </div>
        )}

        {/* 点分布地图 */}
        <div className="animal-map">
          <h3 className="occurrence-map-title">Occurrence Records Map</h3>
          <MapContainer center={[-25, 133]} zoom={3} style={{ height: "300px", width: "100%" }}>
            <TileLayer
              url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            />
            {occurrences.map((item, idx) => (
              <CircleMarker
                key={idx}
                center={[item.decimalLatitude, item.decimalLongitude]}
                radius={5}
                color="blue"
                fillOpacity={0.7}
              >
                <Tooltip>{item.eventDate}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* ✅ Related Plants：同一植物一张卡，底部逐行显示所有 interaction_type_raw */}
      {Array.isArray(relations) && relations.length > 0 && (
        <section className="related-plants-section">
          <div className="related-plants-hero">
            <h2 className="related-plants-title">Related Plants</h2>
          </div>

          <div className="related-plants-grid">
            {relations.map((rel, idx) => (
              <article className="related-plant-card" key={idx}>
                {/* 名称 */}
                <h3 className="related-plant-name">
                  {rel.vernacular_name || rel.plant_scientific_name || "No Name"}
                </h3>

                {/* 图片（relations 的 plant_image_url） */}
                {rel.plant_image_url ? (
                  <img
                    src={rel.plant_image_url}
                    alt={rel.vernacular_name || rel.plant_scientific_name || "No Image"}
                    className="related-plant-img"
                  />
                ) : (
                  <div className="related-plant-noimg">No Data</div>
                )}

                {/* 所有 interaction_type_raw：一条一行，按顺序 */}
                <div className="related-plant-relation-list">
                  {rel.interactions && rel.interactions.length > 0 ? (
                    rel.interactions.map((t, i) => (
                      <p className="related-plant-relation" key={i}>
                        {t}
                      </p>
                    ))
                  ) : (
                    <p className="related-plant-relation">No Relation Data</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AnimalDetail;
