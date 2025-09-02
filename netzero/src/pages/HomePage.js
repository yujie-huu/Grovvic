import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import HomePageCard from '../components/HomePageCard';

const HomePage = () => {
  const navigate = useNavigate();

  // Navigation handlers for each section

  // Navigate to weather page
  const handleWeatherClick = () => {
    console.log('Navigating to Weather Page');
    navigate('/weather');
  };

  // Navigate to garden plan page
  const handlePlanClick = () => {
    console.log('Navigating to Garden Plan Page');
    navigate('/gardenplan');
  };

  // Navigate to about page
  const handleLearnMoreClick = () => {
    console.log('Navigating to About Page');
    navigate('/about');
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
            <button className="cta-button" onClick={handleLearnMoreClick}>Learn More</button>
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
                <span className="banner-line">Grow Smarter</span>
                <span className="banner-line">Garden Greener</span>
                <span className="banner-line">Live NetZero</span>
                {/* <img src="/images/banner_TreeRoot.png" alt="home page banner - tree root" /> */}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Content Cards Section - Continuous white background */}
      <div className="content-cards-section">

        {/* Weather Section */}
        <HomePageCard
          title="Gardening Weather & Climate Dashboard"
          description="Stay informed with daily forecasts, gardening tips, and climate insights. from past trends to future projections."
          imageSrc="/images/homepage_weather1.png"
          imageAlt="Garden & Weather"
          imagePosition="left"
          onClick={handleWeatherClick}
          className="weather-card"
        />

        {/* Garden Plan Section */}
        <HomePageCard
          title="Plan Your Garden Smarter"
          description="See what to plant each month, get simple care guides, and stay updated on local pests and diseases."
          imageSrc="/images/homepage_plan1.png"
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