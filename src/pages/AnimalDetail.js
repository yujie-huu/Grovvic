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

  // ✅ 新增：保存 related plants 数据
  const [relations, setRelations] = useState([]);

  // ✅ 获取动物信息 & 分布信息
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
          // ✅ 只有 1 个点：画一个缓冲圆 (10 km 半径)
          const point = turf.point([data[0].decimalLongitude, data[0].decimalLatitude]);
          const buffer = turf.buffer(point, 10, { units: "kilometers" });
          if (buffer) {
            const coords = buffer.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
            setPolygonBounds(coords);
          }
        } else if (data.length === 2) {
          // ✅ 只有 2 个点：画一个矩形包围盒
          const line = turf.lineString(data.map(d => [d.decimalLongitude, d.decimalLatitude]));
          const bboxPoly = turf.bboxPolygon(turf.bbox(line));
          if (bboxPoly) {
            const coords = bboxPoly.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
            setPolygonBounds(coords);
          }
        } else if (data.length > 2) {
          // ✅ 3 个点及以上：画凸包
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

  // ✅ 获取相关植物信息（仅此处替换）
  useEffect(() => {
    if (!name) return;

    const relUrl = `https://netzero-vigrow-api.duckdns.org/iter2/relations/by-animal?animal=${encodeURIComponent(
      name
    )}`;

    // 规范化品种名：去掉首尾空格、把多空格压成一个空格
    const normalizeName = (raw) =>
      (raw || "")
        .replace(/\u2013|\u2014/g, "-") // 替换长短横线为普通连字符
        .replace(/\s+/g, " ")
        .trim();

    // 根据 plant_scientific_name 生成 variety URL（统一用 encodeURIComponent）
    const buildVarietyUrl = (plantName) => {
      const normalized = normalizeName(plantName);
      return `https://netzero-vigrow-api.duckdns.org/variety/${encodeURIComponent(
        normalized
      )}`;
    };

    fetch(relUrl)
      .then((res) => res.json())
      .then(async (data) => {
        const enriched = await Promise.all(
          data.map(async (rel) => {
            const candidateUrl = buildVarietyUrl(rel.plant_scientific_name);

            try {
              // 第一次：用规范化+encode 的品种名请求 /variety
              const vRes = await fetch(candidateUrl);
              if (vRes.ok) {
                const vData = await vRes.json();
                
                console.log("DEBUG final image url for", rel.plant_scientific_name,JSON.stringify(vData.image_url));

                return {
                  ...rel,
                  // ✅ 关键：使用 /variety 返回的 image_url
                  image_url: vData.image_url || "",
                  // 名称优先用 overview["Botanical name"]，否则回退到 plant_scientific_name
                  vernacular_name:
                    vData.overview?.["Botanical name"] || "No Name",
                };
              }

              // 如果第一次不成功，再尝试一个更“激进”的回退：去掉品种名里的额外符号后再请求一次
              const fallbackName = normalizeName(
                rel.plant_scientific_name?.replace(/\s*-\s*/g, "-")
              );
              if (fallbackName && fallbackName !== rel.plant_scientific_name) {
                const vRes2 = await fetch(
                  `https://netzero-vigrow-api.duckdns.org/variety/${encodeURIComponent(
                    fallbackName
                  )}`
                );
                if (vRes2.ok) {
                  const vData2 = await vRes2.json();
                  return {
                    ...rel,
                    image_url: vData2.image_url || "",
                    vernacular_name:
                      vData2.overview?.["Botanical name"] || rel.plant_scientific_name,
                  };
                }
              }
            } catch (e) {
              console.error("Error fetching variety info:", e);
            }

            // 全部失败时保底：图片留空，名称退回原始学名
            return {
              ...rel,
              image_url: "",
              vernacular_name: rel.plant_scientific_name,
            };
          })
        );

        setRelations(enriched);
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

      {/* ✅ 两个地图并排显示 */}
      <div className="animal-maps-container">
        {/* 覆盖范围凸包地图 */}
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
          <MapContainer
            center={[-25, 133]}
            zoom={3}
            style={{ height: "300px", width: "100%" }}
          >
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

      {/* ✅ Related Plants 部分（只有有数据时才显示） */}
      {Array.isArray(relations) && relations.length > 0 && (
        <section className="related-plants-section">
          {/* 绿色横幅 + 白色标题 */}
          <div className="related-plants-hero">
            <h2 className="related-plants-title">Related Plants</h2>
          </div>

          <div className="related-plants-grid">
            {relations.map((rel, idx) => (
              <article className="related-plant-card" key={idx}>
                {/* 顶部名称 */}
                <h3 className="related-plant-name">
                  {rel.vernacular_name || rel.plant_scientific_name || "No Image"}
                </h3>

                {/* 中间：如果有图片就显示图片，否则显示文字 */}
                {rel.image_url ? (
                  <img
                    src={rel.image_url}
                    alt={rel.vernacular_name || rel.plant_scientific_name || "No Data"}
                    className="related-plant-img"
                  />
                ) : (
                  <div className="related-plant-noimg">No Data</div>
                )}

                {/* 底部关系描述 */}
                <p className="related-plant-relation">
                  {rel.interaction_type_raw || "No Relation Data"}
                </p>
              </article>
            ))}
          </div>





        </section>
      )}

    </div>
  );
};

export default AnimalDetail;
