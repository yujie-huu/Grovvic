import React, { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Biodiversity.css";
import "./SearchBiodiversity.css";
import SearchBiodiversity from "./SearchBiodiversity";
import MarkerClusterGroup from "react-leaflet-markercluster";
// Import CSS files for marker clustering
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// Import vernacular orders data
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
  const [selectedGroups, setSelectedGroups] = useState([]); // vernacular_order multi-select
  const [selectAll, setSelectAll] = useState(false);        // "All" switch
  const [occurrences, setOccurrences] = useState([]);
  const [speciesFlags, setSpeciesFlags] = useState([]);
  const [loading, setLoading] = useState(false);

  // New: cache map-flags data by animal_taxon_name
  const [mapFlagsByName, setMapFlagsByName] = useState({}); // { [animal_taxon_name]: mapFlagsObj }

  const mapBoxRef = useRef(null);
  const [mapHeight, setMapHeight] = useState(0);

  // Fetch flags data
  useEffect(() => {
    fetch("https://netzero-vigrow-api.duckdns.org/iter2/species/animals/flags")
      .then((res) => res.json())
      .then((data) => setSpeciesFlags(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching species flags:", err));
  }, []);

  // Current classification group list
  const groupOptions = useMemo(() => {
    if (!selectedCategory) return [];
    const key = LABEL_TO_KEY[selectedCategory];
    return (orders?.[key] ?? []).slice();
  }, [selectedCategory]);

  // Load occurrences by classification + group/All, and load map-flags for needed species
  useEffect(() => {
    if (!selectedCategory) return;

    const key = LABEL_TO_KEY[selectedCategory];
    if (!key) return;

    // First by large category
    let filtered = speciesFlags.filter((s) => {
      if (key === "animals") return s.animals === "T" || s.animals === true;
      if (key === "pollinators") return s.pollinators === "T" || s.pollinators === true;
      if (key === "pests_and_weeds") return s.pests_and_weeds === "T" || s.pests_and_weeds === true;
      return false;
    });

    // When "All" is not selected, filter by small category
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

    // Needed species name list (for request map-flags & occurrences)
    const speciesNames = Array.from(
      new Set(
        filtered
          .map((s) => s.animal_taxon_name || s.taxon_name)
          .filter(Boolean)
      )
    );

    setLoading(true);

    // 1) Fetch all species occurrences (coordinate points)
    const occPromises = speciesNames.map((name) =>
      fetch(
        `https://netzero-vigrow-api.duckdns.org/iter2/occurrences/by-animal?animal=${encodeURIComponent(
          name
        )}`
      )
        .then((res) => res.json())
        .catch(() => [])
    );

    // 2) Fetch all species map-flags (source of hover tooltip info)
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
        // Merge coordinate points
        const merged = occResults.flat().filter(Boolean);
        setOccurrences(merged);

        // Merge map-flags into dictionary
        const flagsDict = Object.fromEntries(flagsEntries);
        setMapFlagsByName(flagsDict);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedGroups, selectAll, speciesFlags]);

  // Select/deselect a small category
  const toggleGroup = (g, checked) => {
    setSelectAll(false);
    setSelectedGroups((prev) =>
      checked ? Array.from(new Set([...prev, g])) : prev.filter((x) => x !== g)
    );
  };

  // Click category button
  const handleSelectCategory = (label) => {
    setSelectedCategory(label);
    setSelectedGroups([]);
    setSelectAll(false);
    setOccurrences([]);
    setMapFlagsByName({});
  };

  // Clear filtering
  const handleClear = () => {
    setSelectedCategory("");
    setSelectedGroups([]);
    setSelectAll(false);
    setOccurrences([]);
    setMapFlagsByName({});
  };

  // Left filter bar is equal height (follow map container)
  useEffect(() => {
    const setH = () => {
      if (mapBoxRef.current) setMapHeight(mapBoxRef.current.offsetHeight);
    };
    setH();
    window.addEventListener("resize", setH);
    return () => window.removeEventListener("resize", setH);
  }, []);

  // Generate Tooltip content based on map-flags (replace the original tooltip)
  const renderTooltipContent = (animalTaxonName) => {
    const info = mapFlagsByName?.[animalTaxonName];
    if (!info) {
      return <div>Loading...</div>;
    }

    // Only show entries when count > 0
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
        {/* Top three rows */}
        {info.vernacular_name && <div>{info.vernacular_name}</div>}
        {info.vernacular_order && <div>order: {info.vernacular_order}</div>}
        {typeof info.number_of_records === "number" && (
          <div>number_of_records: {info.number_of_records}</div>
        )}

        {/* Count items (only show when >0) */}
        {countsToShow.length > 0 && (
          <div style={{ marginTop: 0, lineHeight: 1.4 }}>
            {countsToShow.map(({ key, count }) => (
              <div key={key}>
                {key}: {count} plants
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
        {/* Left filter bar: height follows map; list only scrolls when overflowed */}
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

        {/* Right map */}
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

              <MarkerClusterGroup
                showCoverageOnHover={false}
                spiderfyOnEveryZoom={true}
                disableClusteringAtZoom={12}
                maxClusterRadius={80}
                chunkedLoading
              >
                {occurrences.map((item, idx) => (
                  <CircleMarker
                    key={`${idx}-${item.decimalLatitude}-${item.decimalLongitude}`}
                    center={[item.decimalLatitude, item.decimalLongitude]}
                    radius={5}
                    color="red"
                    fillOpacity={0.7}
                  >
                    <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                      {renderTooltipContent(item.animal_taxon_name)}
                    </Tooltip>
                  </CircleMarker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          )}
        </div>
      </div>

      {/* No reset, let child components manage their own state */}
      <SearchBiodiversity onSelect={(animalName) => console.log("Search:", animalName)} />
    </div>
  );
};

export default Biodiversity;
