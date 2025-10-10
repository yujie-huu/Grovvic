import React, { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Biodiversity.css";
import "./SearchBiodiversity.css";
import SearchBiodiversity from "./SearchBiodiversity";

// 从 pages 目录相对引入
import orders from "../data/vernacular_orders.json";

const CATEGORY_LABELS = {
  animals: "Animals",
  pollinators: "Pollinators",
  pests_and_weeds: "Pests and Weeds",
};
const LABEL_TO_KEY = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([k, v]) => [v, k])
);

const Biodiversity = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]); // vernacular_order 多选
  const [selectAll, setSelectAll] = useState(false);        // “All” 开关
  const [occurrences, setOccurrences] = useState([]);
  const [speciesFlags, setSpeciesFlags] = useState([]);
  const [loading, setLoading] = useState(false);

  // 新增：按物种名缓存 map-flags 数据
  const [mapFlagsByName, setMapFlagsByName] = useState({}); // { [animal_taxon_name]: mapFlagsObj }

  const mapBoxRef = useRef(null);
  const [mapHeight, setMapHeight] = useState(0);

  // 拉取 flags 数据
  useEffect(() => {
    fetch("https://netzero-vigrow-api.duckdns.org/iter2/species/animals/flags")
      .then((res) => res.json())
      .then((data) => setSpeciesFlags(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching species flags:", err));
  }, []);

  // 当前分类的 group 列表
  const groupOptions = useMemo(() => {
    if (!selectedCategory) return [];
    const key = LABEL_TO_KEY[selectedCategory];
    return (orders?.[key] ?? []).slice();
  }, [selectedCategory]);

  // 根据分类 + group/All 加载 occurrences，并为需要的物种加载 map-flags
  useEffect(() => {
    if (!selectedCategory) return;

    const key = LABEL_TO_KEY[selectedCategory];
    if (!key) return;

    // 先按大类
    let filtered = speciesFlags.filter((s) => {
      if (key === "animals") return s.animals === "T" || s.animals === true;
      if (key === "pollinators") return s.pollinators === "T" || s.pollinators === true;
      if (key === "pests_and_weeds") return s.pests_and_weeds === "T" || s.pests_and_weeds === true;
      return false;
    });

    // “All” 未勾选时，按小类过滤
    if (!selectAll) {
      if (selectedGroups.length > 0) {
        const set = new Set(selectedGroups);
        filtered = filtered.filter((s) => set.has(String(s?.vernacular_order || "").trim()));
      } else {
        filtered = [];
      }
    }

    if (filtered.length === 0) {
      setOccurrences([]);
      setMapFlagsByName({});
      return;
    }

    // 需要的物种名列表（用于请求 map-flags & occurrences）
    const speciesNames = Array.from(
      new Set(
        filtered
          .map((s) => s.animal_taxon_name || s.taxon_name)
          .filter(Boolean)
      )
    );

    setLoading(true);

    // 1) 拉取所有物种的 occurrences（坐标点）
    const occPromises = speciesNames.map((name) =>
      fetch(
        `https://netzero-vigrow-api.duckdns.org/iter2/occurrences/by-animal?animal=${encodeURIComponent(
          name
        )}`
      )
        .then((res) => res.json())
        .catch(() => [])
    );

    // 2) 拉取所有物种的 map-flags（悬浮提示信息来源）
    const mapFlagsPromises = speciesNames.map((name) =>
      fetch(
        `https://netzero-vigrow-api.duckdns.org/iter2/species/animal/${encodeURIComponent(
          name
        )}/map-flags`
      )
        .then((res) => res.json())
        .then((data) => [name, data])
        .catch(() => [name, null])
    );

    Promise.all([Promise.all(occPromises), Promise.all(mapFlagsPromises)])
      .then(([occResults, flagsEntries]) => {
        // 合并坐标点
        const merged = occResults.flat().filter(Boolean);
        setOccurrences(merged);

        // 合并 map-flags 到字典
        const flagsDict = Object.fromEntries(flagsEntries);
        setMapFlagsByName(flagsDict);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedGroups, selectAll, speciesFlags]);

  // 勾选/取消某个小类
  const toggleGroup = (g, checked) => {
    setSelectAll(false);
    setSelectedGroups((prev) =>
      checked ? Array.from(new Set([...prev, g])) : prev.filter((x) => x !== g)
    );
  };

  // 点击类别按钮
  const handleSelectCategory = (label) => {
    setSelectedCategory(label);
    setSelectedGroups([]);
    setSelectAll(false);
    setOccurrences([]);
    setMapFlagsByName({});
  };

  // 清空过滤
  const handleClear = () => {
    setSelectedCategory("");
    setSelectedGroups([]);
    setSelectAll(false);
    setOccurrences([]);
    setMapFlagsByName({});
  };

  // 左侧过滤栏等高（跟随地图容器）
  useEffect(() => {
    const setH = () => {
      if (mapBoxRef.current) setMapHeight(mapBoxRef.current.offsetHeight);
    };
    setH();
    window.addEventListener("resize", setH);
    return () => window.removeEventListener("resize", setH);
  }, []);

  // 根据 map-flags 生成 Tooltip 内容（替换原先的 tooltip）
  const renderTooltipContent = (animalTaxonName) => {
    const info = mapFlagsByName?.[animalTaxonName];
    if (!info) {
      return <div>Loading...</div>;
    }

    // 只在 count > 0 时显示对应条目
    const countKeys = [
      "visits",
      "eats",
      "pollinates",
      "parasite_to",
      "pathogen_to",
      "lays_eggs_on",
    ];

    const countsToShow = countKeys
      .map((key) => {
        const c = info?.[key]?.count ?? 0;
        return c > 0 ? { key, count: c } : null;
      })
      .filter(Boolean);

    return (
      <div style={{ lineHeight: 1.4 }}>
        {/* 头部三行 */}
        {info.vernacular_name && <div>{info.vernacular_name}</div>}
        {info.vernacular_order && <div>order: {info.vernacular_order}</div>}
        {typeof info.number_of_records === "number" && (
          <div>number_of_records: {info.number_of_records}</div>
        )}

        {/* 计数类（仅显示 >0 的） */}
        {countsToShow.length > 0 && (
          <div style={{ marginTop: 0, lineHeight: 1.4 }}>
            {countsToShow.map(({ key, count }) => (
              <div key={key}>
                {key}: {count}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="biodiversity-page">
      <h1>Biodiversity in Victoria</h1>
      <p>Filter by category and hover over map dots to highlight species with total observations.</p>

      <div className="biodiversity-container">
        {/* 左侧过滤栏：高度跟随地图；列表仅在溢出时滚动 */}
        <div
          className="filter-panel"
          style={{ height: mapHeight || "auto", display: "flex", flexDirection: "column" }}
        >
          <h3>Which local organisms do you want to see?</h3>
          <div className="category-buttons">
            {Object.values(CATEGORY_LABELS).map((label) => (
              <button
                key={label}
                className={`category-btn ${selectedCategory === label ? "active" : ""}`}
                onClick={() => handleSelectCategory(label)}
              >
                {label}
              </button>
            ))}
            <button className="clear-btn" onClick={handleClear}>
              Clear
            </button>
          </div>

          <h3>Filter by group:</h3>
          <div
            className="checkbox-list scrollable-list"
            style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}
          >
            {!selectedCategory && <div className="muted">Select a category first</div>}

            {selectedCategory && (
              <label key="__all__">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAll(checked);
                    if (checked) setSelectedGroups([]);
                  }}
                />{" "}
                All
              </label>
            )}

            {selectedCategory &&
              groupOptions.map((group) => (
                <label key={group}>
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group)}
                    onChange={(e) => toggleGroup(group, e.target.checked)}
                    disabled={selectAll}
                  />{" "}
                  {group}
                </label>
              ))}
          </div>
        </div>

        {/* 右侧地图 */}
        <div className="map-container" ref={mapBoxRef}>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <MapContainer
              center={[-37.8, 145]}
              zoom={7}
              className="map-leaflet"
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
              {occurrences.map((item, idx) => (
                <CircleMarker
                  key={`${idx}-${item.decimalLatitude}-${item.decimalLongitude}-${item.eventDate}`}
                  center={[item.decimalLatitude, item.decimalLongitude]}
                  radius={5}
                  color="red"
                  fillOpacity={0.7}
                >
                  {/* 使用 map-flags 的内容替换原有 tooltip 渲染 */}
                  <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                    {renderTooltipContent(item.animal_taxon_name)}
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>

      {/* 不传任何 reset，完全由子组件自行管理恢复 */}
      <SearchBiodiversity onSelect={(animalName) => console.log("Search:", animalName)} />
    </div>
  );
};

export default Biodiversity;
