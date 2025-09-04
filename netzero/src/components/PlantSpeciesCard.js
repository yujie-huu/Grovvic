import React from "react";
import "./PlantCard.css";

const PlantSpeciesCard = ({ plant }) => {
    return (
        <div className="plant-card">
          <div className="plant-image-container">
            <img 
              src={plant.image_url} 
              alt={plant.plant_name}
              className="plant-image"
              onError={(e) => {
                e.target.src = "/images/no_image_available.jpg"; // fallback image
              }}
            />
        </div>
        <div className="plant-name">
        {plant.plant_name}
        </div>
    </div>
    );
};

export default PlantSpeciesCard;