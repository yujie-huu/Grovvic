import React from 'react';
import './GardenPlan.css';

const GardenPlan = () => {
  return (
    <div className="gardenplan-page">
      {/* Banner Section - Ribbon-like area */}
      <section className="banner-section">
        <div className="banner-background-plan">
          <div className="banner-overlay">
            <div className="banner-content">
              <h2 className="banner-title">
                <p className="banner-line">Victoria’s Gardening Guide</p>
                <p className="banner-line">What to Plant, Care Tips & Wildlife Support</p>
              </h2>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GardenPlan; 