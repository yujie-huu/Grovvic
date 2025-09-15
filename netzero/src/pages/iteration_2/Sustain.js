import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdFlipToFront, MdOpenInNew } from 'react-icons/md';
import './Sustain.css';


const PLAYLIST_ID = "PLYdRxE9m5LdlZsSbe2I48uR1tWED30X_t";
const API_KEY = "AIzaSyDL11eWRj8MmtqUqrF5R-Rzu8ycD6cSdv8";

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
      description: 'Food waste accounts or 8-10% of annual worldwide carbon emissions. ' +
        '\n\nCompared to landfilling, composting food waste reduces emissions by 96%. ' + 
        '\n\nWithout transport, retail, and packaging, gardening reduces food miles by 18%. ' +
        '\n\nVictoria\'s Compost Community program has resources for communities and individual gardeners.'
    },
    {
      id: 2,
      image: '/images/why_sustain_2.jpg',
      title: 'Protect Local Biodiversity',
      description: 'Gardens cover up to 36% of urban areas, providing essential habitats for native wildlife across fragmented landscapes. ' +
        '\n\nNative plants and vegetation layers allows for diverse species of insects, birds, frogs, mammals, and reptiles to thrive. ' + 
        '\n\nReducing pesticide and fertilizer minimizes chemical runoffs that get into the soil and waterways and harm the ecosystem. ' +
        '\n\nBiodiverse gardens have resilience to climate change, contributing to long-term ecological stability.'
    },
    {
      id: 3,
      image: '/images/why_sustain_3.jpg',
      title: 'Save Water',
      description: '56% of household water use is outdoors. ' +
        '\n\nAn efficient watering system cuts water usage by 50%. ' + 
        '\n\nMulching reduces soil water evaporation by 70. ' +
        '\n\nWatering at the right time of the day cuts water usage by 20-30%. ' + 
        '\n\nCapturing rainwater provides a sustainable water source for the garden. ' + 
        '\n\nChoosing native plants adapted for the climate and soils reduces watering needs.'
    },
    {
      id: 4,
      image: '/images/why_sustain_4.jpg',
      title: 'Keep Soil & Air Clean',
      description: 'Composting improves soil health and microbial diversity, while reducing chemical residues from fertilizers. ' +
        '\n\nNot using fertilizers reduces nutrient leaching into waterways by 70%. ' + 
        '\n\nNative plants filter stormwater before it reaches streams, trapping sediments and pollutants. ' +
        '\n\nAvoiding fertilizers lowers nitrous oxide emissions, a greenhouse gas 298 times more potent than CO₂.'
    }
  ];

  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${PLAYLIST_ID}&key=${API_KEY}`
        );
        const data = await res.json();
        if (data.items) {
          setVideos(
            data.items.map((item) => ({
              id: item.snippet.resourceId.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.medium?.url,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch playlist", err);
      }
    };
    fetchPlaylist();
  }, []);

  return (
    <div className="sustain-page">
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
                  <div className="card-title">
                    <span className="card-title-text">{card.title}</span>
                    <div className="flip-icon">
                      <MdFlipToFront />
                    </div>
                  </div>
                </div>
                <div className="card-back">
                  <div className="card-description">{card.description}</div>
                  <div className="flip-icon">
                    <MdFlipToFront />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section className="habitat-videos">
        <h1 className="sustain-title">Habitat Gardening</h1>
        <h2 className="sustain-subtitle">Turn your garden into a thriving ecosystem! Create a space that welcomes pollinators, birds, and various other animals!</h2>
        <div className="habitat-videos-container">
          <div className="video-scroll-panel">
            {videos.map((video) => (
              <div className="video-card" key={video.id}>
                <div
                  className="video-thumbnail"
                  onClick={() =>
                    window.open(`https://www.youtube.com/watch?v=${video.id}`, "_blank")
                  }
                >
                  <img src={video.thumbnail} alt={video.title} />
                  <div className="video-title">{video.title}</div>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-icon"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MdOpenInNew />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sustain;