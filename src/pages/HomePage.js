import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { MdKeyboardArrowDown } from 'react-icons/md';

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

  // Navigate to biodiversity page
  const handleSimulatorClick = () => {
    console.log('Navigating to Simulator Page');
    navigate('/simulation');
  }



  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <video 
          className="hero-video" 
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/images/homepage_hero_video.mp4" type="video/mp4" />
        </video>
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
            {/* <p className="hero-description">
              Your guide to climate-smart gardening in Victoria.
            </p> */}
            {/* <button className="cta-button" onClick={handleLearnMoreClick}>Learn More</button> */}
            <div className="scroll-down-hint">
              <p className='scroll-down-hint-text'>Scroll down to explore more</p>
              <MdKeyboardArrowDown className='scroll-down-arrow'/>
            </div>
          </div>
          
          {/* <div className="hero-visual">
            <div className="earth-placeholder">
              <img src="/images/lightingEarth.png" alt="3D Earth Globe" />
            </div>
          </div> */}
        </div>
      </section>

      {/* Navigation Directory Section */}
      <section className="nav-directory-section">
        <div className="nav-directory-container">
          <div className="nav-item weather-nav" onClick={handleWeatherClick}>
            <span className="nav-text">WEATHER</span>
          </div>
          <div className="nav-item guide-nav" onClick={handlePlanClick}>
            <span className="nav-text">GUIDE</span>
          </div>
          <div className="nav-item sustainable-nav" onClick={handleSustainClick}>
            <span className="nav-text">SUSTAINABLE</span>
          </div>
          <div className="nav-item biodiversity-nav" onClick={handleBioClick}>
            <span className="nav-text">BIODIVERSITY</span>
          </div>
          <div className="nav-item simulator-nav" onClick={handleSimulatorClick}>
            <span className="nav-text">SIMULATOR</span>
          </div>
        </div>
      </section>

      {/* Banner Section - Ribbon-like area */}
      <section className="home-banner-section">
        <img
          className="home-banner-image"
          src="/images/home_banner.png"
          alt="Home banner"
        />
      </section>

      {/* Content Cards Section */}
      <section className="home-cards-section">
        <div className="home-cards-header">
          <h2 className="home-cards-main-title">Everything for Your Garden, All in One Place</h2>
          <p className="home-cards-subtitle">From climate insights to planting guides, find everything you need to grow sustainably in Victoria.</p>
        </div>
        
        <div className="home-cards-container">
          {/* Weather Card */}
          <div className="home-content-card" onClick={handleWeatherClick}>
            <div className="home-card-image">
              <img src="/images/homepage_weather1.png" alt="Garden & Weather" />
            </div>
            <h3 className="home-card-title">GARDENING WEATHER & CLIMATE DASHBOARD</h3>
            <p className="home-card-description">Stay informed with daily forecasts, gardening tips, and climate insights. From past trends to future projections.</p>
          </div>

          {/* Garden Plan Card */}
          <div className="home-content-card" onClick={handlePlanClick}>
            <div className="home-card-image">
              <img src="/images/homepage_plan1.png" alt="Green plants" />
            </div>
            <h3 className="home-card-title">PLANT YOUR GARDEN SMARTER</h3>
            <p className="home-card-description">See what to plant each month, get simple care guides, and stay updated on local pests and diseases.</p>
          </div>

          {/* Sustainability Card */}
          <div className="home-content-card" onClick={handleSustainClick}>
            <div className="home-card-image">
              <img src="/images/homepage_sustain1.jpg" alt="Sustainability" />
            </div>
            <h3 className="home-card-title">GROW YOUR GARDEN SUSTAINABLY</h3>
            <p className="home-card-description">Make eco-friendly choices, design smarter spaces, care for your soil and water, and support biodiversity while keeping your garden thriving.</p>
          </div>

          {/* Biodiversity Card */}
          <div className="home-content-card" onClick={handleBioClick}>
            <div className="home-card-image">
              <img src="/images/homepage_bio1.jpg" alt="Biodiversity" />
            </div>
            <h3 className="home-card-title">DISCOVER LOCAL BIODIVERSITY</h3>
            <p className="home-card-description">Explore pollinators, native species, pests, and weeds in your area to make gardening choices that protect ecosystems and support conservation.</p>
          </div>

          {/* Simulator Card */}
          <div className="home-content-card" onClick={handleSimulatorClick}>
            <div className="home-card-image">
              <img src="/images/homepage_plan2.png" alt="Garden Simulator" />
            </div>
            <h3 className="home-card-title">DESIGN YOUR GARDEN BLUEPRINT</h3>
            <p className="home-card-description">Visualize your garden with a personalized garden design simulator. Learn sustainable choices and avoid common garden layout mistakes.</p>
          </div>
        </div>

        {/* Decorative Plant Images */}
        <div className="home-decorative-plants">
          <img src="/images/cute-plants/corn.png" alt="Corn decoration" className="home-plant-decoration left" />
          <img src="/images/cute-plants/pyrethrum.png" alt="Pyrethrum decoration" className="home-plant-decoration right" />
        </div>
      </section>
    </div>
  );
};

export default HomePage; 