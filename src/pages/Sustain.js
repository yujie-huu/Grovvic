import React, { useMemo, useState, useEffect, useRef } from 'react';
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

  // Navigate to gardening type pages
  const handleGardeningTypeClick = (type) => {
    console.log(`Navigating to ${type} gardening page`);
    navigate(`/gardening/${type}`);
  };

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

  // Add scroll functionality for habitat videos
  const scrollContainerRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  // Handle scroll events for habitat videos
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      setScrollPosition(scrollLeft);
      setMaxScroll(maxScrollLeft);
    }
  };

  // Handle custom scrollbar click for habitat videos
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

  // Handle custom scrollbar drag for habitat videos
  const handleScrollbarDrag = (e, scrollbarRect) => {
    if (scrollContainerRef.current && maxScroll > 0 && scrollbarRect) {
      const clickX = e.clientX - scrollbarRect.left;
      const scrollbarWidth = scrollbarRect.width;
      const scrollRatio = clickX / scrollbarWidth;
      const newScrollPosition = scrollRatio * maxScroll;
      
      scrollContainerRef.current.scrollLeft = newScrollPosition;
    }
  };

  // Update scroll position when component mounts for habitat videos
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      setMaxScroll(maxScrollLeft);
      
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [videos]); // Recalculate when videos change

    // —— Water-wise: Card Content——
  const waterItems = [
    {
      id: 1,
      title: "Water Smart Garden Design",
      intro: "Plan your garden to save water — group plants wisely, create shade, and let every drop soak in.",
      img: "/images/water-water-smart-garden-design.jpg",
      details: [
        "Set a water-saving goal for your garden.",
        "Group plants by their water and light needs (hydro-zoning).",
        "Observe your garden’s conditions across different seasons.",
        "Use hedges, shade, climbers, and tall plants to create microclimates.",
        "Use porous materials like gravel to reduce runoff and help water soak in."
      ]
    },
    {
      id: 2,
      title: "Living Soil",
      intro: "Keep soil alive with compost, worms, and mulch — healthy soil saves water and feeds your garden.",
      img: "/images/water-living-soil.jpg",
      details: [
        "Healthy soil holds more water and needs less irrigation.",
        "Add compost, worm castings, manure, or leaf litter regularly.",
        "Encourage earthworms and microbes to keep soil alive.",
        "Keep soil covered with organic mulch to prevent evaporation."
      ]
    },
    {
      id: 3,
      title: "Plant Choice",
      intro: "Grow with nature — choose drought-tolerant natives and plants that suit your seasons.",
      img: "/images/water-plant-choice.jpg",
      details: [
        "Choose drought-tolerant or native plants suited to your local climate.",
        "Look for silver, grey, or narrow leaves that lose less moisture.",
        "Pick plants that grow in cooler months and rest in hot months.",
        "Reduce lawn space or use low-water grasses; water deeply, mow less often."
      ]
    },
    {
      id: 4,
      title: "Meaningful Mulch",
      intro: "Mulch is nature’s shield — lock in moisture, block weeds, and protect your soil.",
      img: "/images/water-meaningful-mulch.jpg",
      details: [
        "Mulch retains moisture, reduces weeds, and regulates soil temperature.",
        "Use bark, straw, or living groundcovers like Native Violet.",
        "Apply mulch after spring rain, before summer heat.",
        "Spread mulch 2.5–10 cm thick, but keep it away from plant stems.",
        "Use newspaper or cardboard underneath if weeds are a problem."
      ]
    },
    {
      id: 5,
      title: "Water Sources & Storage",
      intro: "Harvest and reuse every drop — collect rain, store it safely, and recycle wisely to keep your garden thriving.",
      img: "/images/water-water-sources-storage.jpg",
      details: [
        "Collect rainwater from roofs (1mm rain per 1m² = 1L water).",
        "Use greywater only on non-edible plants (fruit trees are OK).",
        "Install tanks with overflow and filters; use drip lines to distribute.",
        "Choose low-phosphorus, low-salt detergents if reusing laundry water.",
        "Alternate greywater with clean water to dilute chemicals."
      ]
    },
    {
      id: 6,
      title: "Water Use",
      intro: "Water with purpose — time it right, use the best methods, and make every drop count.",
      img: "/images/water-water-use.jpg",
      details: [
        "Water early in the morning to minimize evaporation.",
        "Garden beds: water deeply but less often to encourage deep roots",
        "Pots: water sparingly but more frequently; place saucers to catch excess.",
        "Best irrigation methods: drip systems and soaker hoses.",
        "Avoid sprinklers—most water is lost to evaporation."
      ]
    },
    {
      id: 7,
      title: "Preparing for Heatwaves",
      intro: "Beat the heat — strengthen plants, give them shade, and help them recover after stress.",
      img: "/images/water-preparing-for-heatwaves.jpg",
      details: [
        "Water deeply in the morning, targeting the root zone.",
        "Add seaweed solution to strengthen plants against heat.",
        "Shade delicate plants with cloth; move pots into shade.",
        "Place potted plants in trays of water.",
        "After heat stress: soak pots, rehydrate with seaweed solution, prune once weather cools."
      ]
    }
  ];

  // —— Water-wise: Current Item on Right + Scroll bar —— 
  const [activeWaterId, setActiveWaterId] = useState(1); // first item by default

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

      <section className="sustain-gardening-section">
        <div className="sustain-gardening-container">
          <div className="sustain-gardening-content">
            <h1 className="sustain-gardening-title">
              Sustain your Garden. <br />
              Sustain the Earth. <br />
            </h1>
            <h2 className="sustain-gardening-subtitle">
              Recommendations that are healthy and match your aesthetic
            </h2>
            <div className="sustain-gardening-button-container">
              <button className="sustain-gardening-button" onClick={() => handleGardeningTypeClick('balcony')}> Balcony gardening</button>
              <button className="sustain-gardening-button" onClick={() => handleGardeningTypeClick('indoor')}> Indoor gardening</button>
              <button className="sustain-gardening-button" onClick={() => handleGardeningTypeClick('rooftop')}> Rooftop gardening</button>
              <button className="sustain-gardening-button" onClick={() => handleGardeningTypeClick('backyard')}> Backyard gardening</button>
            </div>
          </div>
          <div className="sustain-gardening-images-container">
            <img src="/images/sustain-gardening-balcony.jpg" alt="Balcony garden" />
            <img src="/images/sustain-gardening-indoor.jpeg" alt="Indoor garden" />
            <img src="/images/sustain-gardening-rooftop.jpg" alt="Rooftop garden" />
            <img src="/images/sustain-gardening-backyard.jpg" alt="Backyard garden" />
          </div>
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

      <section className='water-section'>
        <div className='water-header'>
          <h1 className='water-title'>Water-wise Gardening</h1>
        </div>

        <div className="waterwise-content">
          {/* Left: card list (container fixed height, internal scrolling, only 4 cards exposed, remaining scrolling to view) */}
          <div className="ww-left">
            <div className="ww-cardlist" role="list">
              {waterItems.map(item => (
                <button
                  key={item.id}
                  className={`ww-card ${activeWaterId === item.id ? 'is-active' : ''}`}
                  onClick={() => setActiveWaterId(item.id)}
                >
                  <div className="ww-card-thumb">
                    <img src={item.img} alt="" onError={(e)=>{e.target.style.visibility='hidden'}} />
                  </div>
                  <div className="ww-card-body">
                    <div className="ww-card-title">{item.title}</div>
                    <div className="ww-card-intro">{item.intro}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: display panel (switch with left click) */}
          <div className="ww-right">
            {(() => {
              const active = waterItems.find(i => i.id === activeWaterId) || waterItems[0];
              return (
                <div className="ww-detail-card">
                  <div className="ww-detail-hero">
                    <img src={active.img} alt="" onError={(e)=>{e.target.style.visibility='hidden'}} />
                  </div>
                  <div className="ww-detail-content">
                    <h3 className="ww-detail-title">{active.title}</h3>
                    <ol className="ww-detail-list">
                      {active.details.map((d, i) => <li key={i}>{d}</li>)}
                    </ol>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sustain;