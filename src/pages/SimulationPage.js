import React, { useState, useEffect, useRef } from 'react';
import './SimulationPage.css';

const SimulationPage = () => {
  // ---------- Garden Setup Modal (3-step wizard) ----------
  const [bedWidth, setBedWidth]   = useState(null);   // cm
  const [bedLength, setBedLength] = useState(null);   // cm
  const [season, setSeason]       = useState(null);   // 'All season' | 'Summer' ...
  const [sunshine, setSunshine]   = useState(null);   // 'All' | 'Full sun' ...
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState(1);

  const DEFAULTS = {
    bedWidth: 40,
    bedLength: 40,
    season: 'All season',
    sunshine: 'All'
  };

  // On first enter, if any of the setup fields are null, show the setup modal
  useEffect(() => {
    if (bedWidth === null || bedLength === null || season === null || sunshine === null) {
        setShowSetup(true);
    }
  }, []);

  // Close the setup modal; if any of the setup fields are null, set the default values
  const closeSetup = () => {
    if (bedWidth === null)  setBedWidth(DEFAULTS.bedWidth);
    if (bedLength === null) setBedLength(DEFAULTS.bedLength);
    if (season === null)    setSeason(DEFAULTS.season);
    if (sunshine === null)  setSunshine(DEFAULTS.sunshine);
    setShowSetup(false);
  };

  // Next/Previous step
  const nextStep = () => setSetupStep((s) => Math.min(3, s + 1));
  const prevStep = () => setSetupStep((s) => Math.max(1, s - 1));

  // Utility: format cm display
  const cm = (v) => `${v} cm`;

  // Main page button: open the setup modal
  const openSetup = () => setShowSetup(true);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpacing, setSelectedSpacing] = useState(0);
  const [selectedHardiness, setSelectedHardiness] = useState('');
  
  return (
    <div className="simulation-page">
      <section className="simulation-panel-section">
        <div className="simulation-plant-inventory">
          <div className="plant-filter-search-bar">
            <div className="filters-container">
              <select 
                className="simulation-category-dropdown"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              > 
                <option value="" disabled>Select category</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Herbs">Herbs</option>
                <option value="Flowers">Flowers</option>
                <option value="Plants">All Categories</option>
              </select>

              <select 
                className="simulation-hardiness-dropdown"
                value={selectedHardiness}
                onChange={(e) => setSelectedHardiness(e.target.value)}
              > 
                <option value="" disabled>Select hardiness</option>
                <option value="Frost Hardy">Frost Hardy</option>
                <option value="Frost Tender">Frost Tender</option>
                <option value="Half Hardy">Half Hardy</option>
                <option value="All Hardiness">All Hardiness</option>
              </select>

              {/* Plant Spacing Slider */}
              <div className="plant-spacing-slider">
                <label>Plant Spacing</label>
                <input 
                  type="range" 
                  min="0" 
                  max="3" 
                  step="1"
                  value={selectedSpacing} 
                  onChange={(e) => setSelectedSpacing(parseInt(e.target.value))} 
                />
                <span>
                  {selectedSpacing === 0 && "20 cm"}
                  {selectedSpacing === 1 && "40 cm"}
                  {selectedSpacing === 2 && "60 cm"}
                  {selectedSpacing === 3 && "80 cm"}
                </span>
              </div>
            </div>
          </div>

          <div className="simulation-plant-list">

          </div>
        </div>
      </section>
      <section className="simulation-garden-section">
        <div className="simulation-tools-container">
          <button className="open-setup-btn" onClick={openSetup}>
            Edit garden setup
          </button>
        </div>
        <div className="simulation-garden-container">

        </div>
      </section>

      {showSetup && (
        <div className="setup-modal-overlay" role="dialog" aria-modal="true">
          <div className="setup-modal">
            {/* Top bar: close in the top left corner */}
            <button className="setup-close" aria-label="Close" onClick={closeSetup}>✕</button>

            {/* Title & progress */}
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
            <div className="setup-step-indicator">
              Step {setupStep} / 3
            </div>

            {/* Step content */}
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
                    <div className="size-value">{cm(bedWidth ?? 40)}</div>
                  </div>

                  <div className="size-times">×</div>

                  <div className="size-field">
                    <label>Length</label>
                    <input
                        type="range"
                        min="40" max="500" step="20"
                        value={bedLength ?? 40}
                        onChange={(e) => setBedLength(parseInt(e.target.value, 10))}
                    />
                    <div className="size-value">{cm(bedLength ?? 40)}</div>
                  </div>
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
                        You can choose based on your experience. <br/>
                        For more professional measurements, the following standards are provided as reference:<br/>
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

            {/* Bottom buttons */}
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
};

export default SimulationPage;