import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './SimulationPage.css';
import { MdSearch } from 'react-icons/md';

const API_URL = 'https://netzero-vigrow-api.duckdns.org/iter3/plants/filter';

// Map UI values -> API values
const normalizeSeason = (s) => {
  if (!s) return 'All season';
  if (s.startsWith('Summer')) return 'Summer';
  if (s.startsWith('Autumn')) return 'Autumn';
  if (s.startsWith('Winter')) return 'Winter';
  if (s.startsWith('Spring')) return 'Spring';
  return s; // 'All season'
};
const normalizeType = (t) => {
  if (!t || t === 'Plants' || t === 'All Categories') return undefined;
  if (t === 'Vegetables' || t === 'Vegetable') return 'Vegetable';
  if (t === 'Herbs' || t === 'Herb') return 'Herb';
  if (t === 'Flowers' || t === 'Flower') return 'Flower';
  return undefined;
};
const normalizeSpacing = (idx) => {
  if (idx === null || idx === undefined) return undefined;
  switch (idx) {
    case 0: return '20';
    case 1: return '40';
    case 2: return '60';
    case 3: return '80';
    default: return undefined;
  }
};
const normalizeHardiness = (h) => {
  if (!h || h === 'All Hardiness') return undefined;
  return h; // "Frost Hardy" | "Frost Tender" | "Half Hardy"
};
const normalizeSunshine = (s) => s || 'All';

export default function SimulationPage(){
  // ---------- Garden Setup Modal (3-step wizard) ----------
  const [bedWidth, setBedWidth]   = useState(null);   // cm
  const [bedLength, setBedLength] = useState(null);   // cm
  const [season, setSeason]       = useState(null);   // 'All season' | 'Summer' ...
  const [sunshine, setSunshine]   = useState(null);   // 'All' | 'Full sun' ...
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState(1);

  const DEFAULTS = useMemo(() => ({
    bedWidth: 40,
    bedLength: 40,
    season: 'All season',
    sunshine: 'All',
  }), []);

  // On first enter, if any of the setup fields are null, show the setup modal
  useEffect(() => {
    if (bedWidth === null || bedLength === null || season === null || sunshine === null) {
      setShowSetup(true);
    }
  }, [bedWidth, bedLength, season, sunshine]);

  // Close the setup modal; if any of the setup fields are null, set the default values
  const closeSetup = () => {
    if (bedWidth === null)  setBedWidth(DEFAULTS.bedWidth);
    if (bedLength === null) setBedLength(DEFAULTS.bedLength);
    if (season === null)    setSeason(DEFAULTS.season);
    if (sunshine === null)  setSunshine(DEFAULTS.sunshine);
    setShowSetup(false);
    // Load initial plants after setup is complete
    handleFilter();
  };

  // Next/Previous step
  const nextStep = () => setSetupStep((s) => Math.min(3, s + 1));
  const prevStep = () => setSetupStep((s) => Math.max(1, s - 1));

  // Utility: format cm display
  const cm = (v) => `${v} cm`;

  // Main page button: open the setup modal
  const openSetup = () => setShowSetup(true);

  // ---------- Left panel: filters & plant inventory ----------
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpacing, setSelectedSpacing] = useState(null);
  const [selectedHardiness, setSelectedHardiness] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [plants, setPlants] = useState([]); // array of { name, ... }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFilter = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const body = {
        season: normalizeSeason(season ?? DEFAULTS.season),
        sunshine: normalizeSunshine(sunshine ?? DEFAULTS.sunshine),
      };
      const type = normalizeType(selectedCategory);
      const spacing = normalizeSpacing(selectedSpacing);
      const hardiness = normalizeHardiness(selectedHardiness);
      if (type) body.type = type;
      if (spacing) body.spacing = spacing;
      if (hardiness) body.hardiness = hardiness;

      console.log('Sending API request:', body); // Debug log

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('API response:', data); // Debug log
      // Expecting an array with plant objects that include a 'plant_name' field
      setPlants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('API Error:', e); // Debug log
      setError(`Failed to load plants. ${e.message}`);
      setPlants([]);
    } finally {
      setLoading(false);
    }
  }, [season, sunshine, selectedCategory, selectedSpacing, selectedHardiness, DEFAULTS]);

  // Load plants when component mounts and setup is complete
  useEffect(() => {
    if (bedWidth !== null && bedLength !== null && season !== null && sunshine !== null) {
      handleFilter();
    }
  }, [bedWidth, bedLength, season, sunshine, handleFilter]);

  // ---------- Right panel: garden bed grid & drag/drop ----------
  // Calculate grid dimensions based on bed size, but let CSS handle the actual sizing
  const cols = Math.max(1, Math.round((bedWidth ?? DEFAULTS.bedWidth) / 20));
  const rows = Math.max(1, Math.round((bedLength ?? DEFAULTS.bedLength) / 20));
  const size = cols * rows;

  const [cells, setCells] = useState([]); // array of plant names or null

  // Reset grid when bed size changes
  useEffect(() => {
    setCells(Array(size).fill(null));
  }, [size]);

  const dragInfoRef = useRef({});

  const onDragStartInventory = (e, plantName) => {
    dragInfoRef.current = { kind: 'inventory', plantName };
    e.dataTransfer.setData('text/plain', plantName);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const onDragStartCell = (e, index) => {
    const plantName = cells[index];
    if (!plantName) return; // nothing planted
    dragInfoRef.current = { kind: 'cell', from: index, plantName };
    e.dataTransfer.setData('text/plain', plantName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const [overIndex, setOverIndex] = useState(null);

  const allowDrop = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onCellDragEnter = (index) => setOverIndex(index);
  const onCellDragLeave = (index) => {
    if (overIndex === index) setOverIndex(null);
  };

  const onCellDrop = (e, index) => {
    e.preventDefault();
    const info = dragInfoRef.current;
    const name = e.dataTransfer.getData('text/plain') || info.plantName;
    if (!name) return;

    setCells((prev) => {
      const next = [...prev];
      next[index] = name; // plant or move into this cell
      // If moving from another cell, clear old spot
      if (info.kind === 'cell' && typeof info.from === 'number' && info.from !== index) {
        next[info.from] = null;
      }
      return next;
    });
    setOverIndex(null);
  };

  // Trash dropzone to delete plants dragged from cells
  const [trashHot, setTrashHot] = useState(false);
  const onTrashDragOver = (e) => {
    // Only allow if dragging from a cell
    if (dragInfoRef.current.kind === 'cell') {
      e.preventDefault();
      setTrashHot(true);
    }
  };
  const onTrashDragLeave = () => setTrashHot(false);
  const onTrashDrop = (e) => {
    e.preventDefault();
    const info = dragInfoRef.current;
    if (info.kind === 'cell' && typeof info.from === 'number') {
      setCells((prev) => {
        const next = [...prev];
        next[info.from] = null; // delete from bed
        return next;
      });
    }
    setTrashHot(false);
  };
  
  return (
    <div className="simulation-page">
      <section className="simulation-panel-section">
        <div className="simulation-plant-inventory">
          <div className="plant-filter-search-bar">
            <button 
              className={`simulation-filter-toggle-btn ${showFilters ? 'expanded' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="simulation-filter-icon">▼</span>
              Filter
            </button>
            
            <div className="simulation-search-container">
              <span className="simulation-search-icon"><MdSearch /></span>
              <input 
                type="text"
                className="simulation-search-input"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {showFilters && (
            <div className="simulation-filters-container">
              <div className="simulation-filters-content">
                <h3 className="simulation-filters-title">Plant Filter</h3>
                
                <div className="simulation-filter-section">
                  <h4 className="simulation-filter-category">Category</h4>
                  <div className="simulation-filter-options">
                    <button 
                      className={`simulation-filter-option ${selectedCategory === 'Vegetables' ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(selectedCategory === 'Vegetables' ? '' : 'Vegetables')}
                    >
                      Vegetable
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedCategory === 'Herbs' ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(selectedCategory === 'Herbs' ? '' : 'Herbs')}
                    >
                      Herb
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedCategory === 'Flowers' ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(selectedCategory === 'Flowers' ? '' : 'Flowers')}
                    >
                      Flower
                    </button>
                  </div>
                </div>

                <div className="simulation-filter-section">
                  <h4 className="simulation-filter-category">Hardiness</h4>
                  <div className="simulation-filter-options">
                    <button 
                      className={`simulation-filter-option ${selectedHardiness === 'Frost Hardy' ? 'selected' : ''}`}
                      onClick={() => setSelectedHardiness(selectedHardiness === 'Frost Hardy' ? '' : 'Frost Hardy')}
                    >
                      Frost Hardy
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedHardiness === 'Frost Tender' ? 'selected' : ''}`}
                      onClick={() => setSelectedHardiness(selectedHardiness === 'Frost Tender' ? '' : 'Frost Tender')}
                    >
                      Frost Tender
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedHardiness === 'Half Hardy' ? 'selected' : ''}`}
                      onClick={() => setSelectedHardiness(selectedHardiness === 'Half Hardy' ? '' : 'Half Hardy')}
                    >
                      Half Hardy
                    </button>
                  </div>
                </div>

                <div className="simulation-filter-section">
                  <h4 className="simulation-filter-category">Plant Spacing</h4>
                  <div className="simulation-filter-options">
                    <button 
                      className={`simulation-filter-option ${selectedSpacing === 0 ? 'selected' : ''}`}
                      onClick={() => setSelectedSpacing(selectedSpacing === 0 ? null : 0)}
                    >
                      20 cm
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedSpacing === 1 ? 'selected' : ''}`}
                      onClick={() => setSelectedSpacing(selectedSpacing === 1 ? null : 1)}
                    >
                      40 cm
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedSpacing === 2 ? 'selected' : ''}`}
                      onClick={() => setSelectedSpacing(selectedSpacing === 2 ? null : 2)}
                    >
                      60 cm
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedSpacing === 3 ? 'selected' : ''}`}
                      onClick={() => setSelectedSpacing(selectedSpacing === 3 ? null : 3)}
                    >
                      ≥ 80 cm
                    </button>
                  </div>
                </div>

                <div className="simulation-filter-footer">
                  <span className="simulation-plant-count">Available Plants: {plants.length}</span>
                </div>

                <div className="simulation-filter-actions">
                  <button className="simulation-reset-btn" onClick={() => {
                    setSelectedCategory('');
                    setSelectedHardiness('');
                    setSelectedSpacing(null);
                  }}>
                    Reset All
                  </button>
                  <button 
                    className="apply-filter-btn" 
                    onClick={() => {
                      handleFilter();
                      setShowFilters(false); // 关闭filter栏
                    }} 
                    disabled={loading}
                  >
                    Apply Filters({[selectedCategory, selectedHardiness, selectedSpacing].filter(Boolean).length})
                  </button>
                </div>

                {error && <div className="error-banner">{error}</div>}
              </div>
            </div>
          )}

          <div className="plant-display-area">
            <div className="plant-list-header">
              <h3>Available Plants ({plants.length})</h3>
              {loading && <span className="loading-indicator">Loading...</span>}
            </div>

            <div className="simulation-plant-list">
            {plants.length === 0 && !loading ? (
              <div className="no-plants-message">
                <p>No plants found matching your criteria.</p>
                <p>Try adjusting your filters or click "Apply filters" to search again.</p>
              </div>
            ) : (
              plants.map((p, i) => {
                const name = p.plant_name;
                const src = `/images/cute-plants/${name}.png`;
                return (
                  <div key={name + i} className="simulation-plant-card">
                    <img
                      src={src}
                      alt={name}
                      draggable
                      onDragStart={(e) => onDragStartInventory(e, name)}
                    />
                    <div className="simulation-plant-name" title={name}>{name}</div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </section>

      <section className="simulation-garden-section">
        <div className="simulation-tools-container">
          <button className="open-setup-btn" onClick={openSetup}>
            Edit garden setup
          </button>

          {/* Trash dropzone */}
          <div 
            className={`trash-dropzone ${trashHot ? 'hot' : ''}`}
            onDragOver={onTrashDragOver}
            onDragLeave={onTrashDragLeave}
            onDrop={onTrashDrop}
            title="Drag a planted item here to remove it from the bed"
            aria-label="Trash bin"
          >
            🗑️ Remove
          </div>
        </div>

        <div className="garden-wrapper">
          <div className="simulation-garden-container">
            <div className="simulation-garden-scroll">
                <div 
                className="garden-grid"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, minmax(60px, 1fr))`,
                }}
                >
                {Array.from({ length: size }).map((_, idx) => {
                const planted = cells[idx];
                const isOver = overIndex === idx;
                return (
                    <div
                    key={idx}
                    className={`garden-cell ${isOver ? 'over' : ''}`}
                    onDragOver={allowDrop}
                    onDragEnter={() => onCellDragEnter(idx)}
                    onDragLeave={() => onCellDragLeave(idx)}
                    onDrop={(e) => onCellDrop(e, idx)}
                    >
                    {planted && (
                        <img
                        src={`/images/cute-plants/${planted}.png`}
                        alt={planted}
                        draggable
                        onDragStart={(e) => onDragStartCell(e, idx)}
                        className="planted-img"
                        title={`${planted}`}
                        />
                    )}
              </div>
                );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showSetup && (
        <div className="setup-modal-overlay" role="dialog" aria-modal="true">
          <div className="setup-modal">
            <button className="setup-close" aria-label="Close" onClick={closeSetup}>✕</button>

            <h2 className="setup-title">
              <span>Give us your</span>
              <strong>Garden Setup</strong>
            </h2>
            <div className="setup-progress">
              <div
                className="setup-progress-bar"
                style={{ width: `${(setupStep / 3) * 100}%` }}
              />
            </div>
            <div className="setup-step-indicator">Step {setupStep} / 3</div>

            {setupStep === 1 && (
              <div className="setup-panel">
                <h3 className="setup-panel-title">Choose your bed size</h3>
                <p className="setup-panel-sub">Tell us how big your garden is (e.g., 20 × 20cm).</p>

                <div className="size-grid">
                  <div className="size-field">
                    <label>Width</label>
                    <input
                      type="range"
                      min="40" max="500" step="20"
                      value={bedWidth ?? 40}
                      onChange={(e) => setBedWidth(parseInt(e.target.value, 10))}
                    />
                  </div>

                  <div className="size-field">
                    <label>Length</label>
                    <input
                      type="range"
                      min="40" max="500" step="20"
                      value={bedLength ?? 40}
                      onChange={(e) => setBedLength(parseInt(e.target.value, 10))}
                    />
                  </div>
                  
                  <div className="size-value">{cm(bedWidth ?? 40)} × {cm(bedLength ?? 40)}</div>
                </div>
              </div>
            )}

            {setupStep === 2 && (
              <div className="setup-panel">
                <h3 className="setup-panel-title">Choose your season</h3>
                <p className="setup-panel-sub">We’ll recommend plants that thrive right now.</p>

                <div className="field">
                  <label>Season</label>
                  <select
                    value={season ?? 'All season'}
                    onChange={(e) => setSeason(e.target.value)}
                  >
                    <option>All season</option>
                    <option>Summer (Dec–Feb)</option>
                    <option>Autumn (Mar–May)</option>
                    <option>Winter (Jun–Aug)</option>
                    <option>Spring (Sep–Nov)</option>
                  </select>
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="setup-panel">
                <h3 className="setup-panel-title">Choose sun exposure</h3>
                <p className="setup-panel-sub">Full sun, partial shade, or mostly shade.</p>

                <div className="field">
                  <div className="label-with-info">
                    <label>Sun Exposure</label>
                    <span className="info" aria-label="info" tabIndex={0}>
                      ⓘ
                      <span className="tooltip">
                        You can choose based on your experience; for more professional/accurate measurements, the following standards are provided as reference:<br/>
                        Full sun: ≥ 5 kWh·m⁻²<br/>
                        Part sun: 3 – 6 kWh·m⁻²<br/>
                        Part shade: 2 – 5 kWh·m⁻²<br/>
                        Full shade: ≤ 3 kWh·m⁻²
                      </span>
                    </span>
                  </div>

                  <select
                    value={sunshine ?? 'All'}
                    onChange={(e) => setSunshine(e.target.value)}
                  >
                    <option>All</option>
                    <option>Full sun</option>
                    <option>Part sun</option>
                    <option>Part shade</option>
                    <option>Full shade</option>
                  </select>
                </div>
              </div>
            )}

            <div className="setup-actions">
              <button
                className="btn-secondary"
                onClick={setupStep === 1 ? closeSetup : prevStep}
              >
                {setupStep === 1 ? 'Close' : 'Previous'}
              </button>

              <button
                className="btn-primary"
                onClick={setupStep === 3 ? closeSetup : nextStep}
              >
                {setupStep === 3 ? 'Save' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

