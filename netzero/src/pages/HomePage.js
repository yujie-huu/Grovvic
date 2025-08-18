import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="title-green">Environmental</span>
              <span className="title-black">Insights</span>
            </h1>
            <p className="hero-description">
              Your hub for weather, climate, and disaster preparedness in Victoria.
            </p>
            <button className="cta-button">Learn More</button>
          </div>
          <div className="hero-visual">
            <div className="earth-placeholder">
              <img src="/image/lightingEarth.png" alt="3D Earth Globe" />
            </div>
          </div>
        </div>
      </section>

      {/* Weather Section */}
      <section className="weather-section">
        <div className="weather-header">
          <h2>Stay Informed. Stay Safe. Live NetZero.</h2>
        </div>
        
        <div className="weather-forecast">
          <div className="forecast-cards">
            <div className="forecast-card">
              <span className="day">Mon</span>
              <span className="temp">19°C</span>
              <div className="weather-icon">☁️🌧️☀️</div>
            </div>
            <div className="forecast-card">
              <span className="day">Tue</span>
              <span className="temp">18°C</span>
              <div className="weather-icon">☁️🌧️⚡</div>
            </div>
            <div className="forecast-card">
              <span className="day">Wed</span>
              <span className="temp">18°C</span>
              <div className="weather-icon">☁️🌧️⚡</div>
            </div>
            <div className="forecast-card">
              <span className="day">Thu</span>
              <span className="temp">19°C</span>
              <div className="weather-icon">☁️🌧️☀️</div>
            </div>
            <div className="forecast-card">
              <span className="day">Fri</span>
              <span className="temp">21°C</span>
              <div className="weather-icon">☁️🌧️☀️</div>
            </div>
            <div className="forecast-card">
              <span className="day">Sat</span>
              <span className="temp">13°C</span>
              <div className="weather-icon">☁️🌧️⚡</div>
            </div>
            <div className="forecast-card">
              <span className="day">Sun</span>
              <span className="temp">15°C</span>
              <div className="weather-icon">☁️🌧️⚡</div>
            </div>
          </div>
        </div>

        <div className="weather-widgets">
          <div className="widget air-quality">
            <span className="widget-label">AIR QUALITY</span>
            <span className="widget-value">3-Low Health Risk</span>
            <p>See more</p>
          </div>
          <div className="widget sun-uv">
            <div className="sunrise">
              <span className="icon">☀️</span>
              <span className="label">SUNRISE</span>
              <span className="value">5:28 AM</span>
            </div>
            <div className="uv-index">
              <span className="icon">☀️</span>
              <span className="label">UV INDEX</span>
              <span className="value">4 Moderate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Insights Section - Temporarily commented for team discussion */}
      {/* 
      <section className="environment-section">
        <div className="environment-content">
          <div className="environment-text">
            <h2>Environmental Insights Dashboard</h2>
            <p>Helping Victorians Stay Informed With Real-Time Weather, Air Quality, And Climate Insights For Smarter Daily Decisions.</p>
          </div>
          <div className="environment-visual">
            <div className="environment-placeholder">
              <p>Weather & Environment Images</p>
              <p>Please upload related images</p>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Hazards Section */}
      <section className="hazards-section">
        <div className="hazards-content">
          <div className="hazards-text">
            <h2>Stay Ahead Of Hazards</h2>
            <p>Track Bushfires, Floods, Storms, And Heatwaves In Real Time To Keep Your Community Safe.</p>
          </div>
          <div className="hazards-images">
            {/* Two contrast images needed: disaster scene and beautiful home */}
            <div className="image-placeholder disaster">
              <p>Disaster Scene Image</p>
            </div>
            <div className="image-placeholder beautiful">
              <p>Beautiful Home Image</p>
            </div>
          </div>
        </div>
      </section>

      {/* Net Zero Section */}
      <section className="netzero-section">
        <div className="netzero-content">
          <div className="netzero-image">
            {/* Glass sphere image needed here */}
            <div className="sphere-placeholder">
              <p>Glass Sphere with Green City</p>
            </div>
          </div>
          <div className="netzero-text">
            <h2>Towards Net Zero</h2>
            <p>Understand Carbon Emissions, Track Climate Drivers, And Take Action For A Sustainable Future.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 