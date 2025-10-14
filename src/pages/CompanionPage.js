import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdSearch } from 'react-icons/md';
import './CompanionPage.css';

const CompanionPage = () => {
  const navigate = useNavigate();
  const [selectedPlant, setSelectedPlant] = useState('');
  const [searchedPlant, setSearchedPlant] = useState('All'); // Track the actually searched plant
  const [companionPlants, setCompanionPlants] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // null for better error handling
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const availablePlants = [
    "All","Asparagus","Bean","Beetroot","Broccoli","Bulb Onion","Cabbage","Capsicum","Carrot","Cauliflower",
    "Celery","Chilli","Chive","Corn","Cucumber","Dill","Eggplant","Chamomile","Kohlrabi","Leek",
    "Lemon Balm","Lettuce","Nasturtium","Parsley","Pea","Potato","Pumpkin & Winter Squash","Radish","Raspberry",
    "Rosemary","Sage","Silverbeet","Spinach","Strawberry","Summer Squash","Sunflower","Tomato","Turnip",
    "Watermelon","Zucchini"
  ];

  // Fetch companion plants for "All" plants when the page loads
  useEffect(() => {
    const fetchDefaultCompanions = async () => {
      setLoading(true);
      setError(null); // clear previous error
      try {
        const response = await fetch(`https://netzero-vigrow-api.duckdns.org/iter2/companion/plant/All`);
        if (response.ok) {
          const data = await response.json();
          setCompanionPlants(data);
        } else {
          throw new Error('Failed to fetch default companion plants');
        }
      } catch (err) {
        console.error('Error fetching default companion plants:', err);
        setError('Failed to load companion plants. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultCompanions();
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
    setError(null); // clear previous error
    
    try {
      const response = await fetch(`https://netzero-vigrow-api.duckdns.org/iter2/companion/plant/${selectedPlant}`);
      if (!response.ok) {
        throw new Error('Failed to fetch companion plants');
      }
      const data = await response.json();
      setCompanionPlants(data);
      setSearchedPlant(selectedPlant); // Update the searched plant only after successful search
    } catch (err) {
      setError('Failed to load companion plants. Please try again.');
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

  // Show the plant name in the results section
  const displayPlantName = searchedPlant;

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
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={() => {
            if (selectedPlant) {
              handleSearch();
            } else {
              // reload default data
              const fetchDefaultCompanions = async () => {
                setLoading(true);
                setError(null);
                try {
                  const response = await fetch(`https://netzero-vigrow-api.duckdns.org/iter2/companion/plant/All`);
                  if (response.ok) {
                    const data = await response.json();
                    setCompanionPlants(data);
                  } else {
                    throw new Error('Failed to fetch default companion plants');
                  }
                } catch (err) {
                  console.error('Error fetching default companion plants:', err);
                  setError('Failed to load companion plants. Please try again.');
                } finally {
                  setLoading(false);
                }
              };
              fetchDefaultCompanions();
            }
          }}>Retry</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="results-loading">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading companion plants...</p>
          </div>
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
                <span>Good for {displayPlantName}</span>
              </div>
              <div className="companion-grid">
                {goodCompanions.map((companion, index) => (
                  <div key={index} className="companion-card">
                    <div className="companion-image">
                      <img 
                        src={companion.neighbour_image_url} 
                        alt={companion.neighbour}
                        loading="lazy"
                        decoding="async"
                        width="250"
                        height="200"
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
                <span>Bad for {displayPlantName}</span>
              </div>
              <div className="companion-grid">
                {badCompanions.map((companion, index) => (
                  <div key={index} className="companion-card">
                    <div className="companion-image">
                      <img 
                        src={companion.neighbour_image_url} 
                        alt={companion.neighbour}
                        loading="lazy"
                        decoding="async"
                        width="250"
                        height="200"
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

      {/* No Results State */}
      {!loading && !error && companionPlants.length === 0 && (
        <div className="results-error">
          <p>No companion plants found. Try selecting a different plant.</p>
        </div>
      )}
    </div>
  );
};

export default CompanionPage;
