import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './GardenType.css';
import { MdArrowBack } from 'react-icons/md';

const GardeningType = () => {
  const navigate = useNavigate();
  const { type } = useParams();

  // 4 types of gardening content
  const gardeningData = {
    balcony: {
      title: "BALCONY GARDEN",
      intro: "A balcony provides a wonderful opportunity to create a beautiful and productive green space. It is perfect for green thumbs with limited time to garden. Typically balcony gardens are planted out with pots and free standing raised beds.",
      considerations: [
        {
          title: "Weight",
          content: "It is important to determine how much weight your balcony can hold. Remember to factor in that containers get even heavier when you water them."
        },
        {
          title: "Space", 
          content: "Make the most of it but don’t get so carried away with pot plants and a worm farm that you have no where to sit and enjoy them. Remember the option of going vertical: hanging baskets, planter boxes, tiered shelving and window boxes can all be utilised."
        },
        {
          title: "Shade",
          content: "Choose plants that will grow in the conditions of your balcony. If you have a south facing balcony you will struggle to grow plants that need full sun. Better to select shade tolerant plants."
        },
        {
          title: "Wind",
          content: "Balconies can be exposed to strong winds that can dehydrate foliage and topple over any top-heavy pots. Select wind tolerant plants that don’t grow too tall and avoid light plastic pots. Attractive screens of matting can also be attached to balcony railing to reduce wind exposure."
        },
        {
          title: "Water",
          content: "Potted plants dry out very quickly so consider self-watering pots that have their own water reservoir. This is particularly important when you intend to go away for a couple of days or in hot weather. For standard pots, make sure excess water runoff is collected in pot saucers."
        },
        {
          title: "Neighbour",
          content: "Prevent water from cascading down to your neighbours’ balcony below every time you water. Make sure your pots don’t become missiles by appropriately securing them to your balcony."
        }
      ],
      images_url: [
        "https://images.pexels.com/photos/14965658/pexels-photo-14965658/free-photo-of-geraniums-in-pots-on-balcony.jpeg",
        "https://storage.needpix.com/rsynced_images/balcony-garden-402609_1280.jpg", 
        "https://images.stockcake.com/public/3/7/b/37b156c1-43f8-4b9f-a48f-603d001a765d/urban-balcony-garden-stockcake.jpg",
        "/images/balcony-garden4.jpg"
      ]
    },
    rooftop: {
      title: "ROOFTOP GARDEN",
      intro: "Rooftop access provides a great opportunity to establish a garden haven to relax, to entertain or to grow produce. Typically rooftop gardens are set up in containers and raised beds",
      considerations: [
        {
          title: "Weight",
          content: "You need to know the load bearing capacity of your roof to ensure that containers filled with soil, plants, water and mulch can be supported by your rooftop."
        },
        {
          title: "Shade",
          content: "Rooftop gardens can get very hot in the day and tend to hold onto this heat overnight. Silverleafed, drought tolerant plants are generally recommended. If your rooftop garden is heavily shaded by surrounding buildings, shade tolerant plants will perform best."
        },
        {
          title: "Water", 
          content: "Most rooftop gardens need watering at least once a day in summer so you need to consider the practicality of hand watering or the convenience of a timed irrigation system. During periods of higher rainfall, drainage also needs to be considered."
        },
        {
          title: "Wind",
          content: "Your rooftop garden will probably be unsheltered and exposed to high winds. Use heavy pots or your plants will topple over in every strong gust. Consider plants that come from open windswept areas."
        }
      ],
      images_url: [
        "https://live.staticflickr.com/5526/9209732902_3636f17c53_b.jpg",
        "https://live.staticflickr.com/6186/6039783279_2a347bbbbd_b.jpg",
        "https://exteriordesignsbev.com/wp-content/uploads/2016/06/Murray-Penthouse.jpg"
      ]
    },
    indoor: {
      title: "INDOOR GARDEN",
      intro: "Indoor plants not only make a space more appealing but are hugely beneficial to our health. They improve air quality, especially by reducing VOCs (Volatile Organic Compounds) that indoor items give off.",
      considerations: [
        {
          title: "Water",
          content: "Most indoor plants die from being over-watered. To combat this, you can either use a self-watering pot that regulates the uptake of water into the soil or regularly check the dampness of the soil and only water when the soil has dried out."
        },
        {
          title: "Feeding",
          content: "Overdoing it with the fertilizer is another reason why indoor plants die or do poorly. Indoor plants are best fed no more than twice a year."
        },
        {
          title: "Dust",
          content: "Periodically wiping the leaves of your indoor plants with a damp cloth helps remove dust that may clog the pores and keeps the plant foliage looking shiny and healthy."
        },
        {
          title: "Rotation",
          content: "Turn your pot around every now and again to keep growth even."
        }
      ],
      images_url: [
        "https://images.pexels.com/photos/9402629/pexels-photo-9402629.jpeg",
        "https://source.roboflow.com/yVSH6U9zggYyTgl7BR63MzEqY9s1/1OtSY6AAeKa6SMa2fnIq/original.jpg",
        "https://images.pexels.com/photos/28941596/pexels-photo-28941596/free-photo-of-cozy-indoor-garden-with-relaxing-cat.jpeg"
      ]
    },
    backyard: {
        title: "Backyard GARDEN",
        intro: "A backyard or courtyard garden can be a private retreat to relax with family, to entertain friends, and to grow your own produce. You need to decide how to design your garden based on the available space, the time you have to tend your garden, the type of garden you want to create, and environmental limitations. You can use varying containers, from planting directly in the soil, garden beds, to pots.",
        considerations: [
          {
            title: "Shade",
            content: "Look for the sunny and shaded areas in different seasons. Check if there are high walls and trees that restrict the amount of sunlight. If there is limited sunlight, select shade-tolerant plants or use pots on wheels that can be moved around easily."
          },
          {
            title: "Water", 
            content: "Pay attention to how water flows through your garden. If the ground is predominantly made of hard flooring or concrete, consider using raised garden beds or replacing it with sand paths."
          },
          {
            title: "Heat",
            content: "If the soil is paved, it can have poor ventilation that results in heat build up. This may mean higher water requirements, which can be mitigated by installing an efficient watering system."
          },
          {
            title: "Soil Depth",
            content: "If soil depth is less than 500 mm before reaching clay, then build up garden beds to avoid plants literally drowning in the soil. Do not dig into or plant in heavy clay as your plants will not survive."
          },
          {
            title: "Space",
            content: "Limited space should not inhibit your ability to design well. Remember to use your vertical spaces as well as your horizontal spaces. You can use columnar or standard plant varieties along paths, espaliered fruit trees on a wall, a scented creeper on a trellis, strawberries in hanging baskets, or position small potted plants on the steps of an old ladder."
          }
        ],
        images_url: [
          "https://websites.umass.edu/valec/files/2018/08/garden-types-sm-032.jpg",
          "https://images.stockcake.com/public/c/9/9/c997ed0c-75f7-468b-9416-2270bb438a1d/verdant-garden-beds-stockcake.jpg", 
          "https://upload.wikimedia.org/wikipedia/commons/a/a3/Spring_Landscape_Design_NYC.jpeg",
          "https://c.pxhere.com/photos/9b/9b/terrace_garden_garden_design_gartendeko_garden_architecture_garden_decoration_design_flowers-939595.jpg!d"
        ]
      }
  };

  const currentData = gardeningData[type];

  if (!currentData) {
    return (
      <div className="gardening-type-page">
        <div className="error-message">
          <h1>Page Not Found</h1>
          <p>The gardening type "{type}" does not exist.</p>
          <button onClick={() => navigate(-1)} className="back-button">
            <MdArrowBack />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gardening-type-page">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/sustain')}>
        <MdArrowBack />
      </button>

      {/* Main Content */}
      <div className="gardening-content">
        {/* Introduction Section */}
        <div className="intro-section">
          <img 
            src={currentData.images_url[0]} 
            alt={`${currentData.title} overview`}
            className="intro-image"
          />
          <div className="intro-text">
            <h1 className="gardening-title">{currentData.title}</h1>
            <p className="gardening-intro">{currentData.intro}</p>
          </div>
        </div>

        {/* Considerations Section */}
        <div className="considerations-section">
          <h2 className="considerations-title">CONSIDERATIONS:</h2>
          
          <div className="considerations-rows">
            {currentData.considerations.map((consideration, index) => {
              const rowIndex = Math.floor(index / 2);
              const isRightImage = rowIndex % 2 === 0;
              const isFirstInRow = index % 2 === 0;
              const isLastInRow = index % 2 === 1;
              const isLastRow = rowIndex === Math.floor((currentData.considerations.length - 1) / 2);
              
              // Start a new row for every two considerations
              if (isFirstInRow) {
                return (
                  <div key={rowIndex} className={`consideration-row ${isRightImage ? 'image-right' : 'image-left'}`}>
                    <img 
                      src={currentData.images_url[rowIndex + 1]} 
                      alt={`${currentData.title} consideration ${rowIndex + 1}`}
                      className="consideration-image"
                    />
                    <div className="consideration-items">
                      <div className="consideration-item">
                        <h3 className="consideration-title">{consideration.title}</h3>
                        <p className="consideration-content">{consideration.content}</p>
                      </div>
                      {currentData.considerations[index + 1] && (
                        <div className="consideration-item">
                          <h3 className="consideration-title">{currentData.considerations[index + 1].title}</h3>
                          <p className="consideration-content">{currentData.considerations[index + 1].content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null; // Skip rendering for second item in each row
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardeningType;