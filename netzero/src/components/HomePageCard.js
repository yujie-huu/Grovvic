import React from 'react';
import './HomePageCard.css';

const HomePageCard = ({ 
  title, 
  description, 
  imageSrc, 
  imageAlt, 
  imagePosition = 'right', // 'left' or 'right'
  onClick,
  className = ''
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`homepage-card ${className} ${imagePosition === 'left' ? 'image-left' : 'image-right'}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="card-content">
        <div className="card-text">
          <h2 className="card-title">{title}</h2>
          <p className="card-description">{description}</p>
        </div>
        <div className="card-image">
          <img src={imageSrc} alt={imageAlt} />
        </div>
      </div>
    </div>
  );
};

export default HomePageCard; 