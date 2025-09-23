import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdWarning } from 'react-icons/md';
import './CompanionPage.css';

const CompanionPage = () => {
  const navigate = useNavigate();
  const [availablePlants, setAvailablePlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [companionPlants, setCompanionPlants] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch available plants on component mount
  useEffect(() => {
    const fetchAvailablePlants = async () => {
      try {
        const response = await fetch('https://netzero-vigrow-api.duckdns.org/iter2/companion/plants');
        if (!response.ok) {
          throw new Error('Failed to fetch available plants');
        }
        const data = await response.json();
        setAvailablePlants(data);
      } catch (err) {
        setError('Failed to load available plants');
        console.error('Error fetching available plants:', err);
      }
    };

    fetchAvailablePlants();
  }, []);

  // Handle input change and show suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSelectedPlant(value);
    
    if (value.length > 0) {
      const filtered = availablePlants.filter(plant =>
        plant.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredPlants(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle plant selection from dropdown
  const handlePlantSelect = (plant) => {
    setSelectedPlant(plant);
    setShowSuggestions(false);
  };

  // Handle plant selection from suggestions
  const handleSuggestionClick = (plant) => {
    setSelectedPlant(plant);
    setShowSuggestions(false);
  };

  // Handle search button click
  const handleSearch = async () => {
    if (!selectedPlant.trim()) {
      setError('Please select a plant to search');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://netzero-vigrow-api.duckdns.org/iter2/companion/plant/${selectedPlant}`);
      if (!response.ok) {
        throw new Error('Failed to fetch companion plants');
      }
      const data = await response.json();
      setCompanionPlants(data);
    } catch (err) {
      setError('Failed to load companion plants');
      console.error('Error fetching companion plants:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter companion plants by good/bad
  const goodCompanions = companionPlants.filter(plant => plant.good_or_bad === 'good');
  const badCompanions = companionPlants.filter(plant => plant.good_or_bad === 'bad');

  return (
    <div className="companion-page">
      {/* Header Section */}
      <div className="companion-header">
        <div className="back-button" onClick={() => navigate(-1)}>
          <MdArrowBack />
        </div>
        
        <div className="search-container">
          <div className="search-bar">
            <div className="dropdown-container">
              <select 
                className="plant-dropdown"
                value={selectedPlant}
                onChange={(e) => handlePlantSelect(e.target.value)}
              >
                <option value="">Select Plant</option>
                {availablePlants.map((plant, index) => (
                  <option key={index} value={plant}>
                    {plant}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="input-container">
              <div className="search-icon"> <MdSearch /> </div>
              <input
                ref={inputRef}
                type="text"
                className="plant-input"
                placeholder="Enter plant name..."
                value={selectedPlant}
                onChange={handleInputChange}
              />
              
              {/* Suggestions dropdown */}
              {showSuggestions && filteredPlants.length > 0 && (
                <div ref={suggestionsRef} className="suggestions-dropdown">
                  {filteredPlants.map((plant, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(plant)}
                    >
                      {plant}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button className="companion-search-button" onClick={handleSearch} disabled={loading}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <icon style={{ marginRight: '8px'}}><MdWarning/></icon>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-message">
          Loading companion plants...
        </div>
      )}

      {/* Results Section */}
      {companionPlants.length > 0 && (
        <div className="results-section">
          <h2 className="results-title">Companion Plants:</h2>
          
          {/* Good Companions */}
          {goodCompanions.length > 0 && (
            <div className="companion-section good-section">
              <div className="section-header good-header">
                <span>Good for {selectedPlant}</span>
              </div>
              <div className="companion-grid">
                {goodCompanions.map((companion, index) => (
                  <div key={index} className="companion-card">
                    <div className="companion-image">
                      <img 
                        src={companion.neighbour_image_url} 
                        alt={companion.neighbour}
                        onError={(e) => {
                          e.target.src = '/images/no_image_available.jpg';
                        }}
                      />
                    </div>
                    <div className="companion-info">
                      <h3 className="companion-name">{companion.neighbour.toUpperCase()}</h3>
                      <p className="companion-reason">{companion.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bad Companions */}
          {badCompanions.length > 0 && (
            <div className="companion-section bad-section">
              <div className="section-header bad-header">
                <span>Bad for {selectedPlant}</span>
              </div>
              <div className="companion-grid">
                {badCompanions.map((companion, index) => (
                  <div key={index} className="companion-card">
                    <div className="companion-image">
                      <img 
                        src={companion.neighbour_image_url} 
                        alt={companion.neighbour}
                        onError={(e) => {
                          e.target.src = '/images/no_image_available.jpg';
                        }}
                      />
                    </div>
                    <div className="companion-info">
                      <h3 className="companion-name">{companion.neighbour.toUpperCase()}</h3>
                      <p className="companion-reason">{companion.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanionPage;
