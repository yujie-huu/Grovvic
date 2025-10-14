import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './GardenPlan.css';
import PlantSpeciesCard from '../components/PlantSpeciesCard';
import PlantCard from '../components/PlantCard';
import { MdArrowBack } from 'react-icons/md';

const GardenPlan = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [plants, setPlants] = useState([]);

  const [plantVarieties, setPlantVarieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // add error state
  const [showVarieties, setShowVarieties] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [enteredViaCard, setEnteredViaCard] = useState(false);
  
  // track filter applied
  const [appliedCategory, setAppliedCategory] = useState("");
  const [appliedMonth, setAppliedMonth] = useState("");
  
  // plant name search related states
  const [allPlantNames, setAllPlantNames] = useState([]);
  const [selectedPlantName, setSelectedPlantName] = useState("");
  const [filteredPlantNames, setFilteredPlantNames] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [visibleItems, setVisibleItems] = useState(10);

  // Add ref for dropdown container
  const dropdownRef = useRef(null);

  // flower recommendation related states
  const monthMap = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  const currentMonth = monthMap[new Date().getMonth()]; // get current month in short form, e.g., "Jan"
  const [monthlyPlants, setMonthlyPlants] = useState([]); 
  const [monthlyPlantsLoading, setMonthlyPlantsLoading] = useState(false);
  

  // fetch monthly flowers for recommendation
  const fetchMonthlyPlants = useCallback(async () => {
    const currentMonthUrl = `https://netzero-vigrow-api.duckdns.org/plants/month/${currentMonth}`;
    setMonthlyPlantsLoading(true);
    try {
      const monthlyTipResponse = await axios.get(currentMonthUrl);
      // randomly select 3 flowers from the response
      const allPlants = monthlyTipResponse.data;
      const shuffled = allPlants.sort(() => 0.5 - Math.random());
      const randomPlants = shuffled.slice(0, 3);
      setMonthlyPlants(randomPlants);
    } catch (error) {
      console.error("Error fetching monthly plants:", error);
      setMonthlyPlants([]);
    } finally {
      setMonthlyPlantsLoading(false);
    }
  }, [currentMonth]);
  
  // fetch all plant names
  useEffect(() => {
    const fetchAllPlantNames = async () => {
      try {
        const response = await axios.get('https://netzero-vigrow-api.duckdns.org/plants');
        const plantNames = response.data.map(plant => plant.plant_name);
        setAllPlantNames(plantNames);
        setFilteredPlantNames(plantNames);
      } catch (error) {
        console.error('Error fetching plant names:', error);
      }
    };

    fetchAllPlantNames();
  }, []);

  // handle show all click
  const handleShowAll = useCallback(async () => {
    setSelectedCategory("Plants");
    setSelectedMonth("all months");    
    setSelectedPlantName("");
    setShowDropdown(false);
    setAppliedCategory("Plants");
    setAppliedMonth("all months");
    
    // fetch plants by directly call the API
    setLoading(true);
    setError(null);
    setShowVarieties(false);
    try {
      const response = await axios.get('https://netzero-vigrow-api.duckdns.org/plants');
      setPlants(response.data);
    } catch (error) {
      console.error("Error fetching plants:", error);
      setError("Failed to fetch plants. Please try again.");
      setPlants([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array, because the functions inside useCallback use only setState functions

  // fetch monthly plants on component mount
  useEffect(() => {
    fetchMonthlyPlants();
  }, [fetchMonthlyPlants]);

  // Load all plants on component mount
  useEffect(() => {
    handleShowAll();
  }, [handleShowAll]);

  // filter plant names
  useEffect(() => {
    if (selectedPlantName === '') {
      setFilteredPlantNames(allPlantNames);
    } else {
      const filtered = allPlantNames.filter(name =>
        name.toLowerCase().includes(selectedPlantName.toLowerCase())
      );
      setFilteredPlantNames(filtered);
    }
    setVisibleItems(10);
  }, [selectedPlantName, allPlantNames]);

  // handle click outside of dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);
  
  
  // build API URL
  const buildApiUrl = () => {
    const baseUrl = "https://netzero-vigrow-api.duckdns.org/plants"; // base URL that returns all plants
    
    // if both are "all" or empty string, i.e., no condition is selected, return all plants
    if ((selectedCategory === "Plants" || selectedCategory === "") && (selectedMonth === "all months" || selectedMonth === "")) {
      return baseUrl;
    } else if ((selectedCategory !== "Plants" && selectedCategory !== "") && (selectedMonth === "all months" || selectedMonth === "")) {
      return `${baseUrl}/category/${selectedCategory}`; // filter by category
    } else if ((selectedCategory === "Plants" || selectedCategory === "") && (selectedMonth !== "all months" && selectedMonth !== "")) {
      return `${baseUrl}/month/${selectedMonth.slice(0,3)}`; // filter by month
    } else {
      return `${baseUrl}/filter?month=${selectedMonth.slice(0,3)}&category=${selectedCategory}`; // filter by both month and category
    }
  };

  // const selectedConstraints = {selectedCategory}, {selectedMonth};
  // fetch plants data
  const fetchPlants = async () => {
    setLoading(true);
    setError(null); // clear previous error
    setShowVarieties(false);
    try {
      const url = buildApiUrl();
      const response = await axios.get(url);
      setPlants(response.data);
    } catch (error) {
      console.error("Error fetching plants:", error);
      setError("Failed to fetch plants. Please try again.");
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

  // fetch plant varieties
  const fetchPlantVarieties = async (speciesName) => {
    setLoading(true);
    setError(null); // clear previous error·
    try {
      const url = `https://netzero-vigrow-api.duckdns.org/plant/${speciesName}/varieties`;
      const response = await axios.get(url);
      setPlantVarieties(response.data);
      setShowVarieties(true);
      setSelectedSpecies(speciesName);
    } catch (error) {
      console.error("Error fetching plant varieties:", error);
      setError("Failed to fetch plant varieties. Please try again.");
      setPlantVarieties([]);
    } finally {
      setLoading(false);
    }
  };

  // handle filter click
  const handleFilterClick = () => {
    // reset the value of the search input box as the two methods are not compatible
    setSelectedPlantName("");
    setShowDropdown(false);
    // update the applied filter conditions
    setAppliedCategory(selectedCategory);
    setAppliedMonth(selectedMonth);
    if (selectedCategory === "") {setAppliedCategory("Plants");}
    if (selectedMonth === "") {setAppliedMonth("all months");}
    fetchPlants();
  };

  // handle species card click
  const handleSpeciesClick = (speciesName) => {
    setEnteredViaCard(true); // mark as entered via card
    fetchPlantVarieties(speciesName);
  };

  // handle plant name search
  const handlePlantNameSearch = () => {
    if (selectedPlantName && allPlantNames.includes(selectedPlantName)) {
      // reset the values of the filters as the two methods are not compatible
      setSelectedCategory("");
      setSelectedMonth("");
      // mark as entered via search
      setEnteredViaCard(false); 
      fetchPlantVarieties(selectedPlantName);
    }
  };

  // handle plant name input change
  const handlePlantNameChange = (e) => {
    setSelectedPlantName(e.target.value);
    // Only show dropdown if there's text
    if (e.target.value.trim() !== '') {
      setShowDropdown(true);
    }
  };

  // handle input blur (when user clicks outside)
  const handleInputBlur = (e) => {
    // Use setTimeout to allow click events on dropdown options to complete first
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  // handle plant name selection
  const handlePlantNameSelect = (plantName) => {
    setSelectedPlantName(plantName);
    setShowDropdown(false);
  };

  // load more items
  const handleLoadMore = () => {
    setVisibleItems(prev => Math.min(prev + 10, filteredPlantNames.length));
  };

  // go back to species view
  const handleBackToSpecies = () => {
    setShowVarieties(false);
    setPlantVarieties([]);
    setSelectedSpecies("");
    setEnteredViaCard(false);
  };

  // clear all choices and return to initial state
  const handleClearChoice = () => {
    setSelectedCategory("");
    setSelectedMonth("");
    setPlants([]);
    setPlantVarieties([]);
    setShowVarieties(false);
    setSelectedSpecies("");
    setSelectedPlantName("");
    setShowDropdown(false);
    setEnteredViaCard(false);
    // reset the filter status
    setAppliedCategory("");
    setAppliedMonth("");
  };

  return (
    <div className="gardenplan-page">
      {/* Banner Section - Ribbon-like area */}
      <section className="banner-section">
        <div className="banner-background-plan">
          <div className="banner-overlay">
            <div className="banner-content">
              <h2 className="banner-title">
                <p className="banner-line">Victoria's Gardening Guide</p>
                <p className="banner-line">What to Plant, Care Tips & Wildlife Support</p>
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Guide & Tips Section */}
      <section className="guidetips-section">
        <div className="tips-flex-container">
          <div className="monthly-tips-container">
            <h3 className="monthly-tips-title">What To Plant This Month</h3>
            <div className="monthly-tips-plantcards">
            {monthlyPlantsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading recommendations...</p>
                </div>
              ) : monthlyPlants.length > 0 ? (
                monthlyPlants.map((plant, index) => (
                  <PlantSpeciesCard key={`plant-${plant.plant_name}-${index}`} plant={plant} />
                ))
              ) : (
                <div className="no-monthly-tips-message">No plants recommendations for this month</div>
              )}
            </div>
            <p className="monthly-tips-description">You can check the plant detail or search for more plants for this month in the search section below.</p>
          </div>

          <div className="pest-tips-container">
            <h3 className="pest-tips-title">Common Pests in Victoria</h3>
            <div className="pest-tips-content">
              <div className="pest-card">
                <h4 className="pest-card-title">Two-spotted mite</h4>
                <div className="pest-card-image">
                  <img src="/images/two-spotted mite.jpg" alt="Two-spotted mite" />
                </div>
                <p className="pest-card-description">
                  A common pest on flowers and vegetables. It sucks sap, causing yellowing leaves. Use gentle sprays to manage.
                </p>
              </div>
              
              <div className="pest-card">
                <h4 className="pest-card-title">Tomato potato psyllid</h4>
                <div className="pest-card-image">
                  <img src="/images/tomato_potato_psyllid.jpg" alt="Tomato potato psyllid" />
                </div>
                <p className="pest-card-description">
                  Damages tomatoes and potatoes by sucking sap and spreading disease. Remove affected leaves promptly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Plant Search Section */}
      <section className="plantsearch-section">
        <div className="plantsearch-textcontent">
          <h4 className="plantsearch-title">Find Your Perfect Plant</h4>
          <p className="plantsearch-description">
            Search our database of climate-resilient plants suited for Victoria's changing conditions. Filter by type, care level, and wildlife benefits to find the best fit for your garden.
          </p>
        </div>

        <div className="search-bar-container">
          
          {/* Plant Name Search Section */}
          <div className="plant-name-search-container">
            <h5 className="search-section-title">Search by plant name (by species):</h5>
            <div className="plant-name-search-bar">
              <div className="searchable-input-container" ref={dropdownRef}>
                <input
                  type="text"
                  value={selectedPlantName}
                  onChange={handlePlantNameChange}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={handleInputBlur}
                  placeholder="Type to search plant names..."
                  className="searchable-input"
                />
                {showDropdown && (
                  <div className="searchable-dropdown">
                    {filteredPlantNames.length === 0 ? (
                      <div className="no-options">No matching options found</div>
                    ) : (
                      <>
                        {filteredPlantNames.slice(0, visibleItems).map((plantName, index) => (
                          <div
                            key={index}
                            className="dropdown-option"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handlePlantNameSelect(plantName)}
                          >
                            {plantName}
                          </div>
                        ))}
                        
                        
                        {visibleItems < filteredPlantNames.length && (
                          <div className="load-more" onClick={handleLoadMore}>
                            Load more ({filteredPlantNames.length - visibleItems} remaining)
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <button 
                className="search-button" 
                onClick={handlePlantNameSearch}
                disabled={!selectedPlantName || loading || !allPlantNames.includes(selectedPlantName)}
              >
                Search
              </button>
            </div>
          </div>

          {/* Search plants with filters (by month, type) */}
          <div className="filter-dropdown-container">
            <h5 className="search-section-title">Or search by category and month:</h5>
            {/* select box (dropdown list) for plant type: vegetable, herb or flower*/}
            <div className="filter-bar">
              <div className="filter-items">
                <select 
                  className="filter-dropdown" 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                > 
                  <option value="" disabled>Select category</option>
                  <option value="Vegetable">Vegetables</option>
                  <option value="Herb">Herbs</option>
                  <option value="Flower">Flowers</option>
                  <option value="Plants">All Categories</option>
                </select>
                
                {/* select box (dropdown list) for month*/}
                <select 
                  className="filter-dropdown" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="" disabled>Select month</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                  <option value="all months">All Months</option>
                </select>
              </div>
              
              <button className="filter-button" onClick={handleFilterClick} disabled={loading}>
                {loading ? "Loading..." : "Filter"}
              </button>
            </div>
          </div>

          {/* action buttons */}
          <div className="action-buttons">
            {/* show all plants */}
            <button className="show-all-button" onClick={handleShowAll}>
              Show All
            </button>
            {/* clear all choices */}
            <button className="clear-button" onClick={handleClearChoice}>
              Clear All
            </button>
          </div>

          <div className="results-container">

            {showVarieties && (
              <div className="breadcrumb">
                {enteredViaCard && (
                  <button className="back-button" onClick={handleBackToSpecies}>
                    <MdArrowBack/>
                  </button>
                )}
                <h3 className="varieties-title">Varieties of {selectedSpecies}</h3>
              </div>
            )}

            <div className="search-results">
              {/* Loading state */}
              {loading && (
                <div className="search-results-loading">
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading plants...</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="search-results-error">
                  <div className="error-container">
                    <p>❌ {error}</p>
                    <button onClick={() => {
                      if (showVarieties) {
                        fetchPlantVarieties(selectedSpecies);
                      } else {
                        fetchPlants();
                      }
                    }}>Retry</button>
                  </div>
                </div>
              )}

              {/* Normal results display */}
              {!loading && !error && !showVarieties && plants.length > 0 && (
                <div>
                  <h3 className="varieties-title">{appliedCategory} in {appliedMonth}</h3>
                  <div className="plant-cards-container">
                    {plants.map((plant, index) => (
                      <div key={`${plant.plant_name}-${index}`} onClick={() => handleSpeciesClick(plant.plant_name)}>
                        <PlantSpeciesCard plant={plant} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && !error && showVarieties && plantVarieties.length > 0 && (
                <div className="plant-cards-container">
                  {plantVarieties.map((plant, index) => (
                    <PlantCard key={`${plant.variety}-${index}`} plant={plant} />
                  ))}
                </div>
              )}

              {/* No results state */}
              {!loading && !error && plants.length === 0 && plantVarieties.length === 0 && !showVarieties && (
                <div className="search-results-error">
                  <p>No plants found. Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section> 
    </div>
  );
};

export default GardenPlan; 