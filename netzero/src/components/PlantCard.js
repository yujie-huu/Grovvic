import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PlantCard.css";

const PlantCard = ({ plant }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current version from path
  const getCurrentVersion = () => {
    const path = location.pathname;
    if (path.startsWith('/iteration2')) return 'iteration2';
    if (path.startsWith('/iteration1')) return 'iteration1';
    return 'iteration1'; // default to iteration1
  };

  const handleClick = () => {
    const currentVersion = getCurrentVersion();
    // navigate to plant detail page, using variety(plant name) as identifier
    navigate(`/${currentVersion}/plant-detail/${encodeURIComponent(plant.variety)}`);
  };

  return (
    <div className="plant-card" onClick={handleClick}>
      <div className="plant-image-container">
        <img 
          src={plant.image_url} 
          alt={plant.variety}
          className="plant-image"
          onError={(e) => {
            e.target.src = "/images/no_image_available.jpg";
          }}
        />
      </div>
      <div className="plant-name">
        {plant.variety}
      </div>
    </div>
  );
};

export default PlantCard;