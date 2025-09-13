import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sustain.css';

const Sustain = () => {
  const [flippedCards, setFlippedCards] = useState({});

  const toggleCard = (cardId) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const cards = [
    {
      id: 1,
      image: '/images/why_sustain_1.jpg',
      title: 'Cut Food Waste & Food Miles',
      description: 'Food waste accounts for 8-10% of annual worldwide carbon emissions. ' +
        'Compared to landfilling, composting food waste reduces emissions by 96%. ' + 
        'Without transport, retail, and packaging, gardening reduces food miles by 18%. ' +
        'Victoria\'s Compost Community program has resources for communities and individual gardeners.'
    },
    {
      id: 2,
      image: '/images/why_sustain_2.jpg',
      title: 'Protect Local Biodiversity',
      description: 'Gardens cover up to 36% of urban areas, providing essential habitats for native wildlife across fragmented landscapes. ' +
        'Native plants and vegetation layers allows for diverse species of insects, birds, frogs, mammals, and reptiles to thrive. ' + 
        'Reducing pesticide and fertilizer minimizes chemical runoffs that get into the soil and waterways and harm the ecosystem. ' +
        'Biodiverse gardens have resilience to climate change, contributing to long-term ecological stability.'
    },
    {
      id: 3,
      image: '/images/why_sustain_3.jpg',
      title: 'Save Water',
      description: '56% of household water use is outdoors. ' +
        'An efficient watering system cuts water usage by 50%. ' + 
        'Mulching reduces soil water evaporation by 70. ' +
        'Watering at the right time of the day cuts water usage by 20-30%. ' + 
        'Capturing rainwater provides a sustainable water source for the garden. ' + 
        'Choosing native plants adapted for the climate and soils reduces watering needs.'
    },
    {
      id: 4,
      image: '/images/why_sustain_4.jpg',
      title: 'Keep Soil & Air Clean',
      description: 'Composting improves soil health and microbial diversity, while reducing chemical residues from fertilizers. ' +
        'Not using fertilizers reduces nutrient leaching into waterways by 70%. ' + 
        'Native plants filter stormwater before it reaches streams, trapping sediments and pollutants. ' +
        'Avoiding fertilizers lowers nitrous oxide emissions, a greenhouse gas 298 times more potent than CO₂.'
    }
  ];

  return (
    <section className="sustain-header">
      <h1 className="sustain-title">Why Sustainable Gardening</h1>
      <h2 className="sustain-subtitle">Flip each card to discover why it matters</h2>
      <div className="why-sustain-cards">
        {cards.map((card) => (
          <div 
            key={card.id}
            className={`sustain-card ${flippedCards[card.id] ? 'flipped' : ''}`}
            onClick={() => toggleCard(card.id)}
          >
            <div className="card-inner">
              <div className="card-front">
                <img src={card.image} alt={card.title} />
                <div className="card-title">{card.title}</div>
                <div className="flip-icon">↗</div>
              </div>
              <div className="card-back">
                <div className="card-description">{card.description}</div>
                <div className="flip-icon">↗</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Sustain;