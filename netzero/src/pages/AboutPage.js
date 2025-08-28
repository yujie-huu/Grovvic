import React from 'react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      {/* Who We Are Section */}
      <section className="about-section who-we-are">
        <div className="section-content full-width">
          <div className="section-text">
            <h1 className="section-title">Who We Are</h1>
            <p className="section-description">
              NetZero Garden is a community-driven initiative designed to help Victorians grow smarter, greener, and more resilient gardens. We bring together seasonal planting advice, real-time weather updates, pest and disease alerts, and biodiversity insights into one easy-to-use hub. Our mission is to empower gardeners with the knowledge and tools they need to adapt to a changing climate while supporting healthier local ecosystems.
            </p>
          </div>
        </div>
      </section>

      {/* Why We Built This Website Section */}
      <section className="about-section why-we-built">
        <div className="section-content with-image">
          <div className="section-text left-aligned">
            <h2 className="section-title">Why We Built This Website</h2>
            <p className="section-description">
              Victoria faces some of the most urgent climate challenges in Australia, from heatwaves and droughts to floods and biodiversity loss. These changes not only threaten communities but also affect how and when we grow our food and plants. Many gardeners are left without clear guidance on what thrives in shifting conditions.
            </p>
            <p className="section-description"> 
              NetZero Garden was created to close this gap. By providing reliable, timely, and practical information—what to plant each month, how to care for it, and how your choices can support pollinators and reduce carbon—we help Victorians make confident gardening decisions today while contributing to a more sustainable tomorrow.
            </p>
          </div>
          <div className="section-image spanning-image">
            <div className="plant-illustration">
              <img src="/images/bushfire1.jpg" alt="Plant in hands with visible roots" />
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="about-section what-we-offer">
        <div className="section-content with-image">
          <div className="section-image">
            <div className="landscape-illustration">
              <img src="/images/GreenCity.png" alt="Layered green landscape with city buildings and trees" />
            </div>
          </div>
          <div className="section-text left-aligned">
            <h2 className="section-title">What We Offer</h2>
            <div className="offerings">
              <div className="offering-item">
                <span className="offering-title">Seasonal Gardening Insights: </span>
                <span className="offering-description">
                  Find out what to plant each month, discover care tips for every species, and learn how changing weather patterns affect your garden.
                </span>
              </div>
              <div className="offering-item">
                <span className="offering-title">Pest & Disease Alerts: </span>
                <span className="offering-description">
                  Stay ahead of local risks with real-time updates on pests, diseases, and climate conditions that impact your plants.
                </span>
              </div>
              <div className="offering-item">
                <span className="offering-title">Biodiversity & Sustainability: </span>
                <span className="offering-description">
                  Explore how your garden supports pollinators and local wildlife, and learn simple steps to reduce your environmental footprint while growing healthy plants.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="about-section our-mission">
        <div className="section-content with-image">
          <div className="section-text left-aligned">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-description">
              We are committed to helping Victorian gardeners become stewards of the environment 
              through sustainable practices, climate-smart gardening techniques, and a deep understanding 
              of our local ecosystems. Together, we can create a greener, more resilient Victoria, 
              one garden at a time.
            </p>
          </div>
          <div className="section-image">
            <div className="mission-illustration">
              <img src="/images/lightingEarth.png" alt="Concentric green rings with Earth and sustainability icons" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 