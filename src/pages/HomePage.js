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

  // Navigate to sustainability page
  const handleSustainClick = () => {
    console.log('Navigating to Sustainability Page');
    navigate('/sustain');
  };

  // Navigate to biodiversity page
  const handleBioClick = () => {
    console.log('Navigating to Biodiversity Page');
    navigate('/biodiversity');
  }



  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="title-green">GROVVIC</span>
            </h1>
            <span className="hero-description-highlight">G</span>
            <span className="hero-description">reen, </span>
            <span className="hero-description-highlight">R</span>
            <span className="hero-description">esilient, </span>
            <span className="hero-description-highlight">O</span>
            <span className="hero-description">rganic, </span>
            <span className="hero-description-highlight">W</span>
            <span className="hero-description">aste-wise for </span>
            <span className="hero-description-highlight">Vic</span>
            <span className="hero-description">toria</span>
            <p className="hero-description">
              Your guide to climate-smart gardening in Victoria.
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
        />

        {/* Garden Plan Section */}
        <HomePageCard
          title="Plan Your Garden Smarter"
          description="See what to plant each month, get simple care guides, and stay updated on local pests and diseases."
          imageSrc="/images/homepage_plan1.png"
          imageAlt="Green plants"
          imagePosition="right"
          onClick={handlePlanClick}
        />

        {/* Sustainability Section */}
        <HomePageCard
          title="Grow Your Garden Sustainably"
          description="Make eco-friendly choices, design smarter spaces, care for your soil and water, and support biodiversity while keeping your garden thriving."
          imageSrc="/images/homepage_sustain1.jpg"
          imageAlt="Sustainability"
          imagePosition="left"
          onClick={handleSustainClick}
        />

        {/* Biodiversity Section */}
        <HomePageCard
          title="Discover Local Biodiversity"
          description="Explore pollinators, native species, pests, and weeds in your area to make gardening choices that protect ecosystems and support conservation."
          imageSrc="/images/homepage_bio1.jpg"
          imageAlt="Biodiversity"
          imagePosition="right"
          onClick={handleBioClick}
        />
      </div>
    </div>
  );
};

export default HomePage; 