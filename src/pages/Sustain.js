import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdFlipToFront, MdOpenInNew } from 'react-icons/md';
import './Sustain.css';


const PLAYLIST_ID = "PLYdRxE9m5LdlZsSbe2I48uR1tWED30X_t";
const API_KEY = "AIzaSyDL11eWRj8MmtqUqrF5R-Rzu8ycD6cSdv8";

const Sustain = () => {
  const navigate = useNavigate();
  const [flippedCards, setFlippedCards] = useState({});
  const [activeTab, setActiveTab] = useState('why');

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

    // Navigate to companion planting page
  const handleCompanionClick = () => {
    console.log('Navigating to Companion Planting Page');
    navigate('/companion');
  };

  // Navigate to composting quiz page
  const handleCompostingQuizClick = () => {
    console.log('Navigating to Composting Quiz Page');
    navigate('/composting');
  };

  const mulchContent = {
    why: {
      subtitle: "It protects the soil around plants and trees from exposure to the elements!",
      benefits: [
        "Retains water in the soil by reducing evaporation",
        "Adds nutrients to the soil",
        "Suppresses weeds",
        "Protects roots from extreme heat or cold",
        "Insulates against ultraviolet radiation and strong wind",
        "Encourages microorganisms and biodiversity"
      ],
      description: "And it makes the garden look pretty!",
      images: [
        "https://wadescapes.com/wp-content/uploads/2023/06/iStock-1215726927.jpg",
        "https://c.pxhere.com/photos/bf/c8/strawberry_beete_garden_food_plant_spring_strawberry_patch_strawberry_plant-634611.jpg!d",
        "https://upload.wikimedia.org/wikipedia/commons/c/cf/Strohballengarten%2C_Strohballenkultur%2C_Straw_bale_b.jpg"
      ]
    },
    which: {
      types: [
        {
          title: "Inorganic Mulches",
          subtitle: "Crushed rocks, pebbles, recycled glass",
          description: "They do not provide nutrients, but still reduce evaporation and suppress weeds. They can be preferable for plants that prosper in dry soil, such as cacti and succulents.",
          image: "https://cdn.prod.website-files.com/6520ca581f993b38bba9de71/6523e1c6ea4ee30f9c2f0ba0_rock-delivery-and-install.jpg"
        },
        {
          title: "Organic Mulches",
          subtitle: "Wood chips, straw, bark, sugarcane, compost",
          description: "For vegetables and annual crops, quick biodegrading mulch can provide plenty of nutrients, and for big trees and native plants, longer-lasting mulch is preferable.",
          image: "https://c.pxhere.com/photos/ab/db/bed_decoration_late_summer_windfall_chaff_terracotta_ball_red-697075.jpg!d"
        },
        {
          title: "Living Mulches",
          subtitle: "Dense, low-growing plants",
          description: "They insulate soil and suppress weed growth, while also helping prevent erosion.",
          image: "https://gardeninggirls.com.au/wp-content/uploads/2023/10/veggie-garden.jpg"
        }
      ]
    },
    how: {
      subtitle: "Follow these steps for effective mulching:",
      steps: [
        "Remove weeds",
        "Moist the soil thoroughly",
        "Lay organic mulch thickly, at least 5 cm, ideally 7-10 cm deep.",
        "Do not mulch right up to the stems of plants, to avoid fungal disease.",
        "Single trees and specimen shrubs are best mulched to the radius of the canopy",
        "Top up biodegradable mulches every 6-12 months."
      ],
      image: "https://horhuttreeexperts.com/wp-content/uploads/2024/11/Root-Collar-Excavation-1024x683.jpg"
    }
  };

  // Add scroll functionality
  const scrollContainerRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  // Handle scroll events
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      setScrollPosition(scrollLeft);
      setMaxScroll(maxScrollLeft);
    }
  };

  // Handle custom scrollbar click
  const handleScrollbarClick = (e) => {
    if (scrollContainerRef.current && scrollbarTrackRef.current && maxScroll > 0) {
      const scrollbarRect = scrollbarTrackRef.current.getBoundingClientRect();
      const clickX = e.clientX - scrollbarRect.left;
      const scrollbarWidth = scrollbarRect.width;
      const scrollRatio = clickX / scrollbarWidth;
      const newScrollPosition = scrollRatio * maxScroll;
      
      scrollContainerRef.current.scrollLeft = newScrollPosition;
    }
  };

  // Handle custom scrollbar drag
  const handleScrollbarDrag = (e, scrollbarRect) => {
    if (scrollContainerRef.current && maxScroll > 0 && scrollbarRect) {
      const clickX = e.clientX - scrollbarRect.left;
      const scrollbarWidth = scrollbarRect.width;
      const scrollRatio = clickX / scrollbarWidth;
      const newScrollPosition = scrollRatio * maxScroll;
      
      scrollContainerRef.current.scrollLeft = newScrollPosition;
    }
  };

  // Update scroll position when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      setMaxScroll(maxScrollLeft);
      
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [videos]); // Recalculate when videos change

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
        <h1 className="habitat-title">Habitat Gardening</h1>
        <h2 className="habitat-subtitle">
          Turn your garden into a thriving ecosystem! Create a space that welcomes pollinators, birds, and various other animals!
        </h2>
        <h3 className="habitat-scorll-instruction">← Scroll sideways to explore videos →</h3>
        
        {/* Custom Scrollbar */}
        <div className="custom-scrollbar-container">
          <div 
            className="custom-scrollbar-track"
            ref={scrollbarTrackRef}
            onClick={handleScrollbarClick}
          >
            <div 
              className="custom-scrollbar-thumb"
              style={{
                width: maxScroll > 0 ? `${(scrollContainerRef.current?.clientWidth / scrollContainerRef.current?.scrollWidth) * 100}%` : '100%',
                left: maxScroll > 0 ? `${(scrollPosition / maxScroll) * (100 - (scrollContainerRef.current?.clientWidth / scrollContainerRef.current?.scrollWidth) * 100)}%` : '0%'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                const scrollbarRect = scrollbarTrackRef.current?.getBoundingClientRect();
                
                const handleMouseMove = (e) => handleScrollbarDrag(e, scrollbarRect);
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          </div>
        </div>

        <div 
          className="habitat-videos-container"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
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

      <section className="sustain-companion-section">
        <h1 className="sustain-companion-title">Companion Planting</h1>
        <h2 className="sustain-companion-subtitle">Discover the best companions for your crops.</h2>
        <div className="sustain-companion-content">
          <button className="companion-button" onClick={handleCompanionClick}>LEARN MORE</button>
        </div>
      </section>

      <section className="sustain-soil-section">
        <div className="sustain-soil-header">
          <h1 className="sustain-soil-title">Sustainable Soil Care</h1>
          <h2 className="sustain-soil-subtitle">
           Healthy soil is the foundation of every resilient garden! <br />
           Learn how to nourish the earth beneath your feet, <br />
           so your plants, and the planet, can thrive.
          </h2>
        </div>

        <div className="sustain-composting-content">
          <h1 className="sustain-composting-title">Composting Quiz</h1>
          <h2 className="sustain-composting-subtitle">
            Do you know how to compost? Test your knowledge and take our quick quiz to discover 
            how much you really know and pick up a few tips about composting!
          </h2>
          <button className="composting-button" onClick={handleCompostingQuizClick}>TAKE THE QUIZ</button>
        </div>
        
        <div className="sustain-mulch-content">
          <h1 className="sustain-mulch-title">Mulch! Mulch! Mulch!</h1>
          
          <div className="mulch-tabs">
            <button 
              className={`mulch-tab ${activeTab === 'why' ? 'active' : ''}`}
              onClick={() => setActiveTab('why')}
            >
              Why
            </button>
            <button 
              className={`mulch-tab ${activeTab === 'which' ? 'active' : ''}`}
              onClick={() => setActiveTab('which')}
            >
              Which
            </button>
            <button 
              className={`mulch-tab ${activeTab === 'how' ? 'active' : ''}`}
              onClick={() => setActiveTab('how')}
            >
              How
            </button>
          </div>

          <div className="mulch-content-area">
            {activeTab === 'why' && (
              <div className="mulch-why-content">
                <h2 className="mulch-content-subtitle">{mulchContent.why.subtitle}</h2>
                <div className="mulch-benefits">
                  {mulchContent.why.benefits.map((benefit, index) => (
                    <div key={index} className="benefit-item">
                      <div className="benefit-item-container">
                        <p className="benefit-text">{benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mulch-content-description">{mulchContent.why.description}</p>
                <div className="mulch-images-grid">
                  {mulchContent.why.images.map((image, index) => (
                    <img key={index} src={image} alt={`Mulch example ${index + 1}`} className="mulch-example-image" />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'which' && (
              <div className="mulch-which-content">
                <div className="mulch-types-grid">
                  {mulchContent.which.types.map((type, index) => (
                    <div key={index} className="mulch-type-card">
                      <div className="mulch-type-header">
                        <h3 className="mulch-type-title">{type.title}</h3>
                        <p className="mulch-type-subtitle">{type.subtitle}</p>
                      </div>
                      <p className="mulch-type-description">{type.description}</p>
                      <div className="mulch-type-image">
                        <img src={type.image} alt={type.title} className="mulch-type-img" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'how' && (
              <div className="mulch-how-content">
                <div className="mulch-how-header">
                  <h2 className="mulch-content-subtitle">{mulchContent.how.subtitle}</h2>
                </div>
                <div className="mulch-how-body">
                  <div className="mulch-steps">
                    {mulchContent.how.steps.map((step, index) => (
                      <div key={index} className="mulch-step">
                        <span className="step-number">{index + 1}</span>
                        <span className="step-text">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mulch-how-image">
                    <img src={mulchContent.how.image} alt="How to mulch" className="mulch-how-img" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sustain;