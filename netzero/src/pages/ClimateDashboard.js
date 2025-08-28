import React from 'react';
import './ClimateDashboard.css';

const ClimateDashboard = () => {
  return (
    <div className="climate-dashboard">
      <div className="dashboard-header">
        <h1>Climate Dashboard</h1>
        <p>Real-time weather, air quality, and climate insights for Victoria</p>
      </div>
      
      <div className="dashboard-content">
        <div className="weather-widget">
          <h3>Current Weather</h3>
          <div className="weather-info">
            <div className="temperature">22°C</div>
            <div className="condition">Partly Cloudy</div>
            <div className="location">Melbourne, VIC</div>
          </div>
        </div>
        
        <div className="air-quality-widget">
          <h3>Air Quality</h3>
          <div className="aqi">AQI: 45</div>
          <div className="status">Good</div>
        </div>
        
        <div className="climate-data-widget">
          <h3>Climate Data</h3>
          <div className="data-grid">
            <div className="data-item">
              <span className="label">Humidity</span>
              <span className="value">65%</span>
            </div>
            <div className="data-item">
              <span className="label">Wind Speed</span>
              <span className="value">15 km/h</span>
            </div>
            <div className="data-item">
              <span className="label">UV Index</span>
              <span className="value">3</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="back-button">
        <button onClick={() => window.history.back()}>← Back to Home</button>
      </div>
    </div>
  );
};

export default ClimateDashboard; 