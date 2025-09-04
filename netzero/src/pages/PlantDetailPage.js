import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PlantDetailPage.css';

const PlantDetailPage = () => {
  const { plantName } = useParams();
  const navigate = useNavigate();
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleGoBack = () => {
    navigate(-1); // go back to previous page
  };

  // Function to format overview text
  const formatOverviewText = (text) => {
    if (!text) return [];
    
    // Split by ✦ symbol and format each part
    const parts = text.split('✦');
    
    const formattedParts = [];
    
    parts.forEach((part, index) => {
      let formattedPart = part.trim();
      
      // Make botanical name bold if it's the first part and contains "Botanical name:"
      if (index === 0 && formattedPart.includes('Botanical name:')) {
        const botanicalNameMatch = formattedPart.match(/(Botanical name: [^,]+)/);
        if (botanicalNameMatch) {
          const botanicalName = botanicalNameMatch[1];
          const restOfText = formattedPart.replace(botanicalNameMatch[1], '');
          
          formattedParts.push(
            <div key={`part-${index}`} className="overview-line">
              <strong>{botanicalName}</strong>{restOfText}
            </div>
          );
        } else {
          formattedParts.push(<div key={`part-${index}`} className="overview-line">{formattedPart}</div>);
        }
      } else {
        // For parts after the first one, combine ✦ symbol with the text
        formattedParts.push(
          <div key={`part-${index}`} className="overview-line">
            <span className="bullet-point">✦ </span>
            {formattedPart}
          </div>
        );
      }
    });
    
    return formattedParts;
  };

  useEffect(() => {
    const fetchPlantData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Encode the plant name for URL (replace spaces with %20)
        const encodedPlantName = encodeURIComponent(plantName);
        const url = `http://3.24.201.81:8000/variety/${encodedPlantName}`;
        
        const response = await axios.get(url);
        setPlantData(response.data);
      } catch (err) {
        console.error('Error fetching plant data:', err);
        setError('Failed to load plant details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (plantName) {
      fetchPlantData();
    }
  }, [plantName]);

  if (loading) {
    return (
      <div className="plant-detail-page">
        {/* Banner Section - Ribbon-like area */}
        <div className="banner-background-detail"></div>

        <div className="plant-detail-content">
          <button className="back-button" onClick={handleGoBack}>
            Back
          </button>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading plant details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plant-detail-page">
        <div className="plant-detail-content">
          <button className="back-button" onClick={handleGoBack}>
            Back
          </button>
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plantData) {
    return (
      <div className="plant-detail-page">
        {/* Banner Section*/}
        <div className="banner-background-detail"></div>
        <div className="plant-detail-content">
          <button className="back-button" onClick={handleGoBack}>
            Back
          </button>
          <div className="error-container">
            <h2>Plant Not Found</h2>
            <p>No details available for this plant.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="plant-detail-page">
      {/* Banner Section - Ribbon-like area */}
      <div className="banner-background-detail"></div>
      <div className='plant-detail-container'>
        <div className="plant-detail-content">
          <button className="back-button" onClick={handleGoBack}>
            Back
          </button>

          <div className="plant-overview">
            <div className="overview-content">
              <div className="plant-detail-image">
                <img 
                  src={plantData.image_url} 
                  alt={plantData.variety}
                  onError={(e) => {
                    e.target.src = '/images/no_image_available.jpg';
                  }}
                />
              </div>
              <div className="plant-basic-info-card">
                <div className="plant-basic-info">
                  <h1 className="overview-title">{plantData.variety}</h1>
                  <div className="overview-text">
                    {formatOverviewText(plantData.overview)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="quick-info-grid">
            <div className="info-card">
              <div className="info-icon">🪴</div>
              <h3>Sowing Method</h3>
              <p>{plantData.quick_method}</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">🌱</div>
              <h3>Sowing Depth</h3>
              <p>{plantData.quick_sowing_depth}</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">🌤️</div>
              <h3>Season</h3>
              <p>{plantData.quick_season}</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">⏱️</div>
              <h3>Germination</h3>
              <p>{plantData.quick_germination}</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">🌿</div>
              <h3>Lifecycle</h3>
              <p>{plantData.quick_hardiness_lifecycle}</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">📐</div>
              <h3>Spacing</h3>
              <p>{plantData.quick_plant_spacing}</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">📏</div>
              <h3>Height</h3>
              <p>{plantData.quick_plant_height}</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">🌞</div>
              <h3>Position</h3>
              <p>{plantData.quick_position}</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">📅</div>
              <h3>Maturity</h3>
              <p>{plantData.quick_days_until_maturity}</p>
            </div>
          </div>

          <div className="notes-pollinator-container">
            {plantData.notes !== "no information now" && (
              <div className="notes-section">
                <div className="notes-content">
                  <h2 className="notes-section-title">📝 Notes</h2>
                  <p className="notes-text">{plantData.notes}</p>
                </div>
              </div>
            )}

            {plantData.notes === "no information now"&& (
              <div className="notes-section">
                <div className="notes-content">
                  <h2 className="notes-section-title">📝 Notes</h2>
                  <p className="notes-text">No additional notes</p>
                </div>
              </div>
            )}

            {(plantData.pollinators || plantData.pollinators === "") && (
              <div className="pollinator-section">
                <div className="notes-content">
                  <h2 className="notes-section-title">🐝 Pollinators</h2>
                  <p className="pollinators-text">
                    {plantData.pollinators && plantData.pollinators.trim() ? plantData.pollinators : "No pollinator information available."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="detailed-instructions-container">
            <div className="instruction-card">
              <h2 className="instruction-card-title">Preparation</h2>
              <div className="instruction-card-content">
                {plantData.preparation.split('\n').map((paragraph, index) => (
                  <p key={index} className="paragraph">{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="instruction-card">
              <h2 className="instruction-card-title">How to Sow</h2>
              <div className="instruction-card-content">
                {plantData.how_to_sow.split('\n').map((paragraph, index) => (
                  <p key={index} className="paragraph">{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="instruction-card">
              <h2 className="instruction-card-title">How to Grow</h2>
              <div className="instruction-card-content">
                {plantData.how_to_grow.split('\n').map((paragraph, index) => (
                  <p key={index} className="paragraph">{paragraph}</p>
                ))}
              </div>
            </div>

            {plantData.how_to_harvest && plantData.how_to_harvest !== "no information now" && (
              <div className="instruction-card">
                <h2 className="instruction-card-title">How to Harvest</h2>
                <div className="instruction-card-content">
                  {plantData.how_to_harvest.split('\n').map((paragraph, index) => (
                    <p key={index} className="paragraph">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantDetailPage;
