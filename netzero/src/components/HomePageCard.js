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
      <div className="homepage-card-content">
        <div className="homepage-card-text">
          <h2 className="homepage-card-title">{title}</h2>
          <p className="homepage-card-description">{description}</p>
        </div>
        <div className="homepage-card-image">
          <img src={imageSrc} alt={imageAlt} />
        </div>
      </div>
    </div>
  );
};

export default HomePageCard; 