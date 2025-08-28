import React from 'react';
import './HomePage.css';
import HomePageCard from '../components/HomePageCard';

const HomePage = () => {
  // Navigation handlers for each section
  // const handleEnvironmentClick = () => {
  //   // Navigate to climate dashboard page
  //   console.log('Navigating to Climate Dashboard');
  //   // For now, using window.location for simple navigation
  //   // In a real app, you'd use React Router: navigate('/climate-dashboard');
  //   window.location.href = '/climate-dashboard';
  // };

  const handleWeatherClick = () => {
    // Navigate to hazards page
    console.log('Navigating to Hazards Page');
    // window.location.href = '/hazards';
    alert('Hazards page coming soon!');
  };

  const handlePlanClick = () => {
    // Navigate to hazards page
    console.log('Navigating to Net Zero Page');
    // window.location.href = '/hazards';
    alert('Net Zero page coming soon!');
  };



  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="title-green">Gardening</span>
              <span className="title-black">Insights</span> 
            </h1>
            <p className="hero-description">
              Your hub for daily weather, planting guides, and climate-smart gardening in Victoria.
            </p>
            <button className="cta-button">Learn More</button>
          </div>
          <div className="hero-visual">
            <div className="earth-placeholder">
              <img src="/images/lightingEarth.png" alt="3D Earth Globe" />
            </div>
          </div>
        </div>
      </section>

      {/* Banner Section - Ribbon-like area */}
      <section className="banner-section">
        <div className="banner-background">
          <div className="banner-overlay">
            <div className="banner-content">
              <h2 className="banner-title">
                <span className="banner-line">Grow Smarter.</span>
                <span className="banner-line">Garden Greener.</span>
                <span className="banner-line">Live NetZero</span>
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Content Cards Section - Continuous white background */}
      <div className="content-cards-section">

        {/* Hazards Section */}
        <HomePageCard
          title="Gardening Weather & Climate Dashboard"
          description="Stay informed with daily forecasts, gardening tips, and climate insights. from past trends to future projections."
          imageSrc="/images/bushfire1.jpg"
          imageAlt="Garden & Weather"
          imagePosition="left"
          onClick={handleWeatherClick}
          className="weather-card"
        />

        {/* Net Zero Section */}
        <HomePageCard
          title="Plan Your Garden Smarter"
          description="See what to plant each month, get simple care guides, and stay updated on local pests and diseases."
          imageSrc="/images/GreenCity.png"
          imageAlt="Green plants"
          imagePosition="right"
          onClick={handlePlanClick}
          className="plan-card"
        />
      </div>
    </div>
  );
};

export default HomePage; 