import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PlantCard.css";

const PlantCard = ({ plant }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    // navigate to plant detail page, using variety(plant name) as identifier
    navigate(`/plant-detail/${encodeURIComponent(plant.variety)}`);
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