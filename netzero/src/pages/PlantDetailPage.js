import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PlantDetailPage.css';

const PlantDetailPage = () => {
  const { plantName } = useParams();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // go back to previous page
  };

  return (
    <div className="plant-detail-page">
      <div className="plant-detail-content">
        <button className="back-button" onClick={handleGoBack}>
          ← Back
        </button>
        
        <h1 className="plant-detail-title">
          {decodeURIComponent(plantName)}
        </h1>
        <p className="plant-detail-description">
          Plant details coming soon...
        </p>
      </div>
    </div>
  );
};

export default PlantDetailPage;
