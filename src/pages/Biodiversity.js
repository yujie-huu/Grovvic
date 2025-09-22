import React, { useEffect, useMemo, useState } from "react";
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

  // 根据分类 + group/All 加载 occurrences
  useEffect(() => {
    if (!selectedCategory) return; // 未选择分类，不加载（保持上次或清空由 Clear 控制）

    const key = LABEL_TO_KEY[selectedCategory];
    if (!key) return;

    // 先按大类
    let filtered = speciesFlags.filter((s) => {
      if (key === "animals") return s.animals === "T" || s.animals === true;
      if (key === "pollinators") return s.pollinators === "T" || s.pollinators === true;
      if (key === "pests_and_weeds") return s.pests_and_weeds === "T" || s.pests_and_weeds === true;
      return false;
    });

    // “All” 未勾选时，按小类过滤；如果一个小类都没勾选，则不显示任何分布
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
      return;
    }

    setLoading(true);
    Promise.all(
      filtered.map((s) =>
        fetch(
          `https://netzero-vigrow-api.duckdns.org/iter2/occurrences/by-animal?animal=${encodeURIComponent(
            s.animal_taxon_name || s.taxon_name
          )}`
        )
          .then((res) => res.json())
          .catch(() => [])
      )
    )
      .then((results) => {
        const merged = results.flat().filter(Boolean);
        setOccurrences(merged);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedGroups, selectAll, speciesFlags]);

  // 勾选/取消某个小类
  const toggleGroup = (g, checked) => {
    setSelectAll(false); // 勾选具体小类时，自动取消 All
    setSelectedGroups((prev) =>
      checked ? Array.from(new Set([...prev, g])) : prev.filter((x) => x !== g)
    );
  };

  // 点击类别按钮
  const handleSelectCategory = (label) => {
    setSelectedCategory(label);
    setSelectedGroups([]);
    setSelectAll(false); // 切类时默认不选 All
  };

  // 点击 Clear
  const handleClear = () => {
    setSelectedCategory("");
    setSelectedGroups([]);
    setSelectAll(false);
    setOccurrences([]); // ✅ 立即清空地图分布
  };

  return (
    <div className="biodiversity-page">
      <h1>Biodiversity in Victoria</h1>
      <p>Filter by category and hover over map dots to highlight species with total observations.</p>

      <div className="biodiversity-container">
        {/* 左侧过滤栏 */}
        <div className="filter-panel">
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
            {/* Clear 与上面按钮同列、左对齐 */}
            <button className="clear-btn" onClick={handleClear}>
              Clear
            </button>
          </div>

          <h3>Filter by animal group:</h3>

          {/* 小类复选（包含 All），超过 8 个滚动 */}
          <div className="checkbox-list scrollable-list">
            {!selectedCategory && <div className="muted">Select a category first</div>}

            {/* ✅ 只有选择了大类才显示 All，位置与子分类一致（在列表顶部） */}
            {selectedCategory && (
              <label key="__all__">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAll(checked);
                    if (checked) setSelectedGroups([]); // 选 All 时清空具体小类选择
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
                    disabled={selectAll} // 选中 All 时禁用小类
                  />{" "}
                  {group}
                </label>
              ))}
          </div>
        </div>

        {/* 右侧地图 */}
        <div className="map-container">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <MapContainer center={[-37.8, 145]} zoom={7} className="map-leaflet" 
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
                  <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                    {item.eventDate}
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>

      {/* 你原来的搜索组件（如需联动可在 onSelect 内更新状态） */}
      <SearchBiodiversity onSelect={(animalName) => console.log("Search:", animalName)} />
    </div>
  );
};

export default Biodiversity;
