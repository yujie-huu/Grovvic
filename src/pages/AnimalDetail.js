// src/pages/iteration_2/AnimalDetail.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polygon } from "react-leaflet";
import * as turf from "@turf/turf";   // 
import "leaflet/dist/leaflet.css";
import "./AnimalDetail.css";

const AnimalDetail = () => {
  const { name } = useParams();
  const [animal, setAnimal] = useState(null);
  const [occurrences, setOccurrences] = useState([]);
  const [polygonBounds, setPolygonBounds] = useState(null);

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

        if (data.length > 2) {
          // ✅ 把点转换为 GeoJSON FeatureCollection
          const points = turf.featureCollection(
            data.map((d) =>
              turf.point([d.decimalLongitude, d.decimalLatitude])
            )
          );

          // ✅ 生成凸包
          const hull = turf.convex(points);

          if (hull) {
            // Leaflet 需要 [lat, lng]，而 GeoJSON 是 [lng, lat]
            const coords = hull.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
            setPolygonBounds(coords);
          }
        }
      })
      .catch((err) => console.error("Error fetching occurrences:", err));
  }, [name]);

  if (!animal) return <p>Loading...</p>;

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
          <h3 className="animal-desc-title">Description</h3>
          <p className="animal-desc-text">{animal.summary}</p>
        </div>
      </div>

      {/* ✅ 两个地图并排显示 */}
      <div className="animal-maps-container">

        {/* 🔵 覆盖范围凸包地图 */}
        {polygonBounds && (
          <div className="animal-map">
            <h3 className="animal-map-title">Compiled Distribution Map</h3>
            <MapContainer
              center={[-25, 133]}   // ✅ 固定澳大利亚中心
              zoom={3}              // ✅ 固定缩放级别
              style={{ height: "300px", width: "100%" }}
              zoomControl={false}   // ⬅️ 可选：禁止缩放按钮
              scrollWheelZoom={false} // ⬅️ 可选：禁止滚轮缩放
            >
              <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />

              {/* 直接画凸包多边形 */}
              <Polygon
                positions={polygonBounds}
                pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.5 }}
              />
            </MapContainer>
          </div>
        )}

        {/* 🔴 点分布地图 */}
        <div className="animal-map">
          <h3>Occurrence Records Map</h3>
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
                // fillColor="#800080"
                fillOpacity={0.7}
              >
                <Tooltip>{item.eventDate}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default AnimalDetail;
