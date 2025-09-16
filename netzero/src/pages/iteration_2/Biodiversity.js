import React from 'react';
import './Biodiversity.css';

const Biodiversity = () => {
  return (
    <div className="biodiversity-page">
      <header className="biodiversity-header">
        <h1>Biodiversity</h1>
        <p>Explore the importance of biodiversity in sustainable gardening</p>
      </header>

      <section className="biodiversity-section">
        <h2>🌱 Why Biodiversity Matters</h2>
        <p>
          Biodiversity helps maintain balance in ecosystems. In your garden, 
          a variety of plants, insects, and microorganisms work together to 
          create resilience against pests, diseases, and climate stress.
        </p>
      </section>

      <section className="biodiversity-section">
        <h2>🌸 Ways to Promote Biodiversity</h2>
        <ul>
          <li>Plant native species that attract pollinators.</li>
          <li>Avoid pesticides that harm beneficial insects.</li>
          <li>Provide habitats like logs, rocks, or water features.</li>
          <li>Rotate crops and diversify plant selection.</li>
        </ul>
      </section>

      <section className="biodiversity-section">
        <h2>🌍 Fun Fact</h2>
        <p>
          A single teaspoon of healthy soil can contain more living organisms 
          than the total number of people on Earth!
        </p>
      </section>
    </div>
  );
};

export default Biodiversity;
