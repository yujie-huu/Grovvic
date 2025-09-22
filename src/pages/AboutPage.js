import React from 'react';
import './AboutPage.css';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const whatWeOfferCards = [
    {
      id: 1,
      icon: 'images/what_we_offer_1.png',
      title: 'Gardening Weather & Climate',
      description: 'Daily & weekly forecasts with tailored gardening tips.'
    },
    {
      id: 2,
      icon: 'images/what_we_offer_2.png',
      title: 'Planting Guide',
      description: 'What to plant each month, plus care and biodiversity insights.'
    },
    {
      id: 3,
      icon: 'images/what_we_offer_3.png',
      title: 'Sustainable Gardening',
      description: 'Low-carbon practices, composting, and waste-wise tips.'
    },
    {
      id: 4,
      icon: 'images/what_we_offer_4.png',
      title: 'Biodiversity & Pollinators',
      description: 'Learn about local species, pests, and how to support ecosystems.'
    },
    {
      id: 5,
      icon: 'images/what_we_offer_5.png',
      title: 'Garden Community & Resources',
      description: 'FAQs, local programs, and links to gardening groups.'
    },
    {
      id: 6,
      icon: 'images/what_we_offer_6.png',
      title: 'My Garden Stats',
      description: 'Track your plants, visualize your garden, and see carbon savings.'
    },
    {
      id: 7,
      icon: 'images/what_we_offer_7.png',
      title: 'Creative Gardening',
      description: 'Ideas for balconies, rooftops, vertical gardens, and recycled designs.'
    }
  ];

  const navigate = useNavigate();

  //Navigate to contact page
  const handleContactUs = () => {
    console.log('Navigating to Weather Page');
    navigate('/contact');
  };

  return (
    <div className="about-page">
      {/* Who We Are Section */}
      <section className="about-banner">
        <div className="about-header">
          <h2 className="about-header-title">OUR VISION</h2>
          <h1 className="about-header-description">
            We empower Victorians to grow resilient, sustainable gardens.
          </h1>
        </div>
        <div className="about-header-notes">
          <div className="about-header-notes-content">
            <h2 className="about-header-notes-title">What drives us</h2>
            <p className="about-header-notes-text">
              Helping Victorians grow greener, smarter, and more resilient gardens.
            </p>
          </div> 
        </div>        
      </section>

      {/* About Us Section */}
      <section className="about-us-section">
        <div className="about-us-content">
          <div className="about-us-text">
            <h2 className="about-us-title">ABOUT US</h2>
            <p className="about-us-description">
              GROVVIC (Green, Resilient, Organic, Waste-wise for Victoria) is a community-focused platform designed to support Victorians in building sustainable, climate-smart gardens.
            </p>
            <p className="about-us-description">
              We bring together real-time weather insights, monthly planting guides, and low-carbon gardening education to make sustainable gardening simple and impactful. By connecting everyday gardeners with knowledge about biodiversity, pollinators, and creative gardening methods, GROVVIC empowers individuals to grow food, reduce waste, and create green spaces that strengthen community resilience against climate change.
            </p>
            <p className="about-us-description">
              At our core, we believe that gardening is more than planting—it’s a way to cut carbon emissions, protect local ecosystems, and nurture healthier, more sustainable lifestyles for Victorians today and for future generations.
            </p>
          </div>
          <div className="about-us-image">
            <img src="/images/aboutus.jpg" alt="about us img" />
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="what-we-offer-section">
        <div className="what-we-offer-container">
          <div className="what-we-offer-header">
            <h3 className="what-we-offer-title">WHAT WE OFFER</h3>  
            <h2 className="what-we-offer-subtitle">
              Services For You
            </h2>
          </div>
          <div className="what-we-offer-content">
            {whatWeOfferCards.map((card) => (
              <div 
                key={card.id}
                className="what-we-offer-card" 
              >
                <h3 className="what-we-offer-card-title">{card.title}</h3>
                <p className="what-we-offer-card-description">{card.description}</p>
                <div className="what-we-offer-card-image">
                  <img src={card.icon} alt={card.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="our-mission-section">
        <div className="our-mission-container">
          <div className="mission-media">
            <article className="mission-card">
              <h2 className="mission-card-title">OUR MISSION</h2>
              <p className="mission-description">Provide reliable and accessible real-time, region-specific weather-based gardening guidance.</p>
              <p className="mission-description">Introduce monthly plant recommendations and beginner-friendly growing guides, including relevant pollinators and pests to consider.</p>
              <p className="mission-description">Connect home gardening with local biodiversity awareness through habitat gardening and companion planting.</p>
              <p className="mission-description">Encourage growing food at home to reduce food miles and food waste.</p>
              <p className="mission-description">Foster a supportive environment through local government programs and gardening communities.</p>
            </article>
          </div>
          <div class="mission-side">
            <div class="mission-side-card">
              <img className="mission-side-card-icon" src="/images/mission1.png" alt="gardener" />
              <div class="mission-side-card-text">Gardeners First</div>
            </div>
            <div class="mission-side-card">
              <img className="mission-side-card-icon" src="/images/mission2.png" alt="sustainability" />
              <div class="mission-side-card-text">Sustainability</div>
            </div>
            <div class="mission-side-card">
              <img className="mission-side-card-icon" src="/images/mission3.png" alt="integrity" />
              <div class="mission-side-card-text">Integrity</div>
            </div>
          </div>
        </div>
      </section>

      <section className='about-contact'>
        <div className='about-contact-container'>
          <h2 className='about-contact-title'>TALK TO US</h2>
          <h2 className='about-contact-subtitle'>We’d Love to Hear from You</h2>
          <button className='about-contact-button' onClick={handleContactUs}>Contact Us</button>
        </div>
      </section>

      <section className='about-reference'>
        <div className='about-reference-container'>
          <h2 className='about-reference-title'>References</h2>
          <ul className='about-reference-list'>
            <li>ABC Gardening Australia. (2018). Choosing mulch. Australian Broadcasting Corporation. https://www.abc.net.au/gardening/how-to/choosing-mulch/9433488</li>
            <li>ABC Gardening Australia. (2018). Companion planting. ABC Gardening Australia. https://www.abc.net.au/gardening/how-to/companion-planting/9433444  </li>
            <li>ABC Gardening Australia. (2018). Compost. Australian Broadcasting Corporation. https://www.abc.net.au/gardening/how-to/compost/9433472</li>
            <li>ABC Gardening Australia. (2018, April 5). Compost troubles. Australian Broadcasting Corporation. https://www.abc.net.au/gardening/how-to/compost-troubles/9433510</li>
            <li>ABC Gardening Australia. (2008). The Science of Watering. ABC Gardening Australia. https://www.abc.net.au/gardening/how-to/the-science-of-watering/9429008</li>
            <li>ABC Gardening Australia. (2020). Where to Start After a Fire. ABC Gardening Australia. https://www.abc.net.au/gardening/where-to-start-after-a-fire/11961586</li>
            <li>ABC. (2024). Tips for mulching your garden: When and best types of mulch. ABC News. https://www.abc.net.au/news/2024-08-02/tips-for-mulching-your-garden-when-best-types-mulch/104153986</li>
            <li>Aloi, P. (2023). When to Mulch: the Dos and Don'ts of Mulching. The Spruce. https://www.thespruce.com/when-to-mulch-7377303</li>
            <li>APS Victoria. (n.d.). Soil Types in Victoria. Australian Plants Society Victoria. https://apsvic.org.au/soil-types-in-victoria/</li>
            <li>Atlas of Living Australia. (n.d.). Victoria region [Interactive map]. Atlas of Living Australia. https://regions.ala.org.au/region?id=8832864#layer=States+and+territories&region=VICTORIA&from=2000</li>
            <li>Barber, R. (2025). Gardening Australia's Guide to Reviving Your Garden after Heavy Rain. ABC News. https://www.abc.net.au/news/2025-03-28/revive-garden-wet-weather/105066382</li>
            <li>Be Groundwater Wise. (2022). 2 Days Watering Fact Sheet. Be Groundwater Wise. https://begroundwaterwise.wa.gov.au/wp-content/uploads/2022/11/2_days_watering_fact_sheet.pdf</li>
            <li>Bureau of Meteorology. (2025). Data Services and Feeds. Australian Government Bureau of Meteorology. https://reg.bom.gov.au/catalogue/data-feeds.shtml</li>
            <li>Bureau of Meteorology. (2025). Weather Station Directory. Australian Government Bureau of Meteorology. https://www.bom.gov.au/climate/data/stations/</li>
            <li>Byrne, J. (2019). Backyard Biodiversity. Gardening Australia. https://www.abc.net.au/gardening/how-to/backyard-biodiversity/11260610</li>
            <li>CFA. (2022). Landscaping for Bushfire. CFA. https://www.cfa.vic.gov.au/ArticleDocuments/447/CFA%20Landscaping%20for%20Bushfire%20(Version%203).pdf</li>
            <li>CFA. (n.d.). Plant Selection Key Interactive. CFA. https://www.cfa.vic.gov.au/plan-prepare/how-to-prepare-your-property/landscaping/plant-selection-key/plant-selection-key</li>
            <li>Chooktopia. (2024). What is Compost Community?. Compost Community. https://www.compostcommunity.com.au/about.html</li>
            <li>Cleveland, D. A., Phares, N., Nightingale, K. D., Weatherby, R. L., Radis, W., Ballard, J., Campagna, M., Kurtz, D., Livingston, K., Riechers, G., & Wilkins, K. (2017). The potential for urban household vegetable gardens to reduce greenhouse gas emissions. Landscape and Urban Planning, 157, 365–374. https://doi.org/10.1016/j.landurbplan.2016.07.008</li>
            <li>Cliff, M. (2024). Weather The Storm I'm a Gardening Expert, Here's How to Keep Your Plot Safe during the Storms Next Week. The Scottish Sun. https://www.thescottishsun.co.uk/fabulous/13652260/keep-garden-safe-storms/</li>
            <li>Climate Change in Australia. (2025). Introduction to Application-Ready Data. Climate Change in Australia. https://www.climatechangeinaustralia.gov.au/en/obtain-data/application-ready-data/</li>
            <li>Cranney, K. (2020). Five Tips for Replanting Your Garden after Bushfires. CSIRO. https://www.csiro.au/en/news/all/articles/2020/january/five-tips-for-replanting-after-bushfires</li>
            <li>Cultivating Flora (2025). Temperature Guidelines for Indoor and Outdoor Plants. Cultivating Flora. https://cultivatingflora.com/temperature-guidelines-for-indoor-and-outdoor-plants/</li>
            <li>Dagny. (2025). No more underwatered or overwatered plants: A comprehensive guide to watering your garden. The Cottage Peach. https://thecottagepeach.com/blog/no-more-underwatered-or-overwatered-plants-a-comprehensive-guide-to-watering-your-garden</li>
            <li>Dielenberg, J. (2024). From bird baths to rocks, seven things people put in their gardens to help wildlife, and how well they work. Biodiversity Council. https://biodiversitycouncil.org.au/news/seven-things-people-put-in-their-gardens-to-help-wildlife-and-how-well-they-work</li>
            <li>Easy Garden Irrigation. (n.d.). Calculating Garden Hose Flow Rate. Easy Garden Irrigation. https://www.easygardenirrigation.co.uk/pages/calculating-garden-hose-flow-rate#howmuch</li>
            <li>Epic Gardening. (n.d.). Composting for beginners. Epic Gardening. https://www.epicgardening.com/composting-for-beginners/</li>
            <li>Exterior Designs by Beverly. (2016). Murray Penthouse [Photograph]. Exterior Designs. https://exteriordesignsbev.com/wp-content/uploads/2016/06/Murray-Penthouse.jpg</li>
            <li>Flickr. (2008). [Balcony garden] [Photograph]. Flickr. https://live.staticflickr.com/3246/2753912473_60f238cced_b.jpg</li>
            <li>Flickr. (2008). [Compost bin] [Photograph]. Flickr. https://live.staticflickr.com/3140/2734302640_2bff2eb378_b.jpg</li>
            <li>Flickr. (2009). [Garden compost] [Photograph]. Flickr. https://live.staticflickr.com/3302/3251916048_39da389738_b.jpg</li>
            <li>Flickr. (2009). [Compost pile] [Photograph]. Flickr. https://live.staticflickr.com/2532/3784646852_39549930ee_b.jpg</li>
            <li>Flickr. (2011). [Garden soil and compost] [Photograph]. Flickr. https://live.staticflickr.com/5225/5660705731_8d03e59385_b.jpg</li>
            <li>Flickr. (2012). [Worm composting] [Photograph]. Flickr. https://live.staticflickr.com/5118/7386662744_c40d2b11c8_b.jpg</li>
            <li>Flickr. (2013,). [Balcony garden] [Photograph]. Flickr. https://live.staticflickr.com/5526/9209732902_3636f17c53_b.jpg</li>
            <li>Flickr. (2024). [Composting with worms] [Photograph]. Flickr. https://live.staticflickr.com/65535/53874873897_a3b5f3d455_b.jpg</li>
            <li>Gardening Girls. (2023, October). Veggie garden [Photograph]. Gardening Girls. https://gardeninggirls.com.au/wp-content/uploads/2023/10/veggie-garden.jpg</li>
            <li>Garden Management. (2024). How Sustainable Gardening Practices Can Improve Your Business’s Environmental Footprint. MA Services Group. https://maservicesgroup.com.au/garden-management/how-sustainable-gardening-practices-can-improve-your-businesss-environmental-footprint/#:~:text=Reducing%20Waste:%20Composting%20diverts%20organic,not%20contributing%20to%20environmental%20pollution</li>
            <li>Global Biotic Interaction. (2025). What Kind of Organisms Do Organisms Pollinate According to a DOI, URI, or Other Identifiers?. GloBi. https://www.globalbioticinteractions.org/?interactionType=pollinates</li>
            <li>Global Biotic Interactions. (n.d.). Global Biotic Interactions (GloBI). Global Biotic Interactions. https://www.globalbioticinteractions.org/</li>
            <li>Harvest Envy. (2024). What to Do When It Won’t Stop Raining: 6 Gardening Tips for Excessive Rain. Harvest Envy. https://www.harvestenvy.com/post/what-to-do-when-it-won-t-stop-raining-6-gardening-tips-for-excessive-rain</li>
            <li>Horhut Tree Experts. (2024, November). Root collar excavation [Photograph]. Horhut Tree Experts. https://horhuttreeexperts.com/wp-content/uploads/2024/11/Root-Collar-Excavation-1024x683.jpg</li>
            <li>Laliberte, K. (2023). When is it Warm Enough to Plant?. Gardener's Supply Company. https://www.gardeners.com/how-to/when-is-it-warm-enough-to-plant/9029.html</li>
            <li>Lawrence, M. G. (2005). The Relationship Between Relative Humidity and the Dewpoint Temperature in Moist Air: A Simple Conversion and Applications. Bull Amer Meteorology Society. 86. 225-233. https://iridl.ldeo.columbia.edu/dochelp/QA/Basic/dewpoint.html</li>
            <li>Linacre, E. T. (1977). A Simple Formula for Estimating Evaporation Rates in Various Climates, using Temperature Data Alone. Agricultural Meteorology. 18 (6). 409-424. https://www.sciencedirect.com/science/article/pii/0002157177900073</li>
            <li>Live to Plant. (2025). Using Shade Cloths to Lower Evaporation in Hot Climates. Live to Plant. https://livetoplant.com/using-shade-cloths-to-lower-evaporation-in-hot-climates/</li>
            <li>McGimpsey, C. (2025). Pollution Prevention Gardening 101. Project Clean Water. https://projectcleanwater.org/pollution-prevention-gardening-101/</li>
            <li>Melbourne City. (n.d.). Urban water. City of Melbourne. https://www.melbourne.vic.gov.au/urban-water</li>
            <li>Moody, H. (2008). Guide to Good Landscape Watering. Irrigation Australia. https://irrigationaustralia.com.au/downloads/eKnowledge/Resources/Guide-to-Good-Landscape-watering-WEBSITE-(replaces-Guide-to-good-watering).pdf?downloadable=1</li>
            <li>Needpix. (n.d.). Balcony garden [Photograph]. Needpix. https://storage.needpix.com/rsynced_images/balcony-garden.jpg</li>
            <li>Needpix. (n.d.). Balcony garden [Photograph]. Needpix. https://storage.needpix.com/rsynced_images/balcony-garden-402609_1280.jpg</li>
            <li>New South Wales Environment Protection Authority. (2024). Emissions impacts of composting food waste (EPA 2024P4523). https://www.epa.nsw.gov.au/sites/default/files/24p4523-emissions-impacts-of-composting-food-waste.pdf</li>
            <li>Old Farmer’s Almanac. (n.d.). Companion planting guide for vegetables. Old Farmer’s Almanac. https://www.almanac.com/companion-planting-guide-vegetables</li>
            <li>OpticWeather. (n.d.). Rainfall Inches to mm Converter. https://www.opticweather.com/tools/precipitation-converter/rainfall-inches-to-mm</li>
            <li>Pexels. (2021). Balcony garden [Photograph]. Pexels. https://images.pexels.com/photos/9402629/pexels-photo-9402629.jpeg</li>
            <li>Pexels. (2021). Balcony garden with plants [Photograph]. Pexels. https://images.pexels.com/photos/7470058/pexels-photo-7470058.jpeg</li>
            <li>Pexels. (2022). Geraniums in pots on balcony [Photograph]. Pexels. https://images.pexels.com/photos/14965658/pexels-photo-14965658/free-photo-of-geraniums-in-pots-on-balcony.jpeg</li>
            <li>Picryl. (2016). Ants on wood [Photograph]. Picryl. https://cdn12.picryl.com/photo/2016/12/31/ants-wood-ants-formica-nature-landscapes-1d1297-1024.jpg</li>
            <li>Picryl. (2016). Dung compost heap [Photograph]. Picryl. https://cdn12.picryl.com/photo/2016/12/31/dung-compost-heap-rallying-point-nature-landscapes-b416c9-1024.jpg</li>
            <li>Planting seeds in cool weather: Duford, M. J. (2023). Soil Temperature for Planting Vegetables Chart. Home for the Harvest. https://homefortheharvest.com/soil-temperature-for-planting-vegetables-chart/</li>
            <li>Poore, J. , Nemecek, T. (2018). Food: Greenhouse gas emissions across the supply chain. Our World in Data. https://ourworldindata.org/grapher/food-emissions-supply-chain?tab=table</li>
            <li>PxHere. (n.d.). Bed decoration with terracotta balls [Photograph]. PxHere. https://c.pxhere.com/photos/ab/db/bed_decoration_late_summer_windfall_chaff_terracotta_ball_red-697075.jpg</li>
            <li>PxHere. (n.d.). Terrace garden design with flowers [Photograph]. PxHere. https://c.pxhere.com/photos/9b/9b/terrace_garden_garden_design_gartendeko_garden_architecture_garden_decoration_design_flowers-939595.jpg</li>
            <li>PxHere. (n.d.). Strawberry patch garden [Photograph]. PxHere. https://c.pxhere.com/photos/bf/c8/strawberry_beete_garden_food_plant_spring_strawberry_patch_strawberry_plant-634611.jpg</li>
            <li>Raymond, C. M., Diduck, A. P., Buijs, A., Boerchers, M., & Moquin, R. (2018). Exploring the co-benefits (and costs) of home gardening for biodiversity conservation. Local Environment, 24(3), 258–273. https://doi.org/10.1080/13549839.2018.1561657</li>
            <li>Reynolds, K. (2025). 5 Easy Ways to Protect Plants During a Storm that Make a Huge Difference, According to Experts. Ideal Home. https://www.idealhome.co.uk/garden/garden-advice/how-to-protect-plants-in-a-storm</li>
            <li>Roboflow. (n.d.). [Balcony garden] [Photograph]. Roboflow. https://source.roboflow.com/yVSH6U9zggYyTgl7BR63MzEqY9s1/1OtSY6AAeKa6SMa2fnIq/original.jpg</li>
            <li>Rodriguez, E. (2025). Should You Mulch After Heavy Rain? Protect Your Garden. Gardener Bible. https://gardenerbible.com/should-you-mulch-after-heavy-rain/</li>
            <li>Royal Horticultural Society. (n.d.). Gardening in a Changing Climate. RHS. https://www.rhs.org.uk/science/gardening-in-a-changing-world/climate-change</li>
            <li>Royal Horticultural Society. (n.d.). Watering. RHS. https://www.rhs.org.uk/garden-jobs/watering</li>
            <li>Royal Horticultural Society. (n.d.). Managing water in your garden. RHS. https://www.sgaonline.org.au/conserving-water/</li>
            <li>Royal Horticultural Society. (n.d.). Mulch. RHS. https://www.rhs.org.uk/soil-composts-mulches/mulch</li>
            <li>SGA. (2012). Sustainable gardening in Melbourne. City of Melbourne. https://www.sgaonline.org.au/pdfs/sg_melbourne.pdf</li>
            <li>SGA. (2020). Water smart gardening: Notes [PDF]. Sustainable Gardening Australia. https://www.sgaonline.org.au/wp-content/uploads/2020/07/200726-Water-Smart-Gardening-%E2%80%93-Notes.pdf</li>
            <li>SGA. (2024). Mulch factsheet [PDF]. Sustainable Gardening Australia. https://www.sgaonline.org.au/wp-content/uploads/2024/04/SGA_Factsheet_MULCH_HR-1.pdf</li>
            <li>SGA. (2025). Companion planting. Sustainable Gardening Australia. https://www.sgaonline.org.au/companion-planting/</li>
            <li>SGA. (2025). Conserving Water. Sustainable Gardening Australia. https://www.sgaonline.org.au/why-sustainable-gardening/</li>
            <li>SGA. (2025). Thriving in the Heat: Managing Plant Heat Stress. Sustainable Gardening Australia. https://www.sgaonline.org.au/thriving-in-the-heat-managing-plant-heat-stress/</li>
            <li>SGA. (2025). Why Sustainable Gardening?. Sustainable Gardening Australia. https://www.sgaonline.org.au/why-sustainable-gardening/</li>
            <li>Sharron, P. (2025). What to do for Flooded Gardens. Sustainable Gardening Australia. https://www.sgaonline.org.au/what-to-do-for-flooded-gardens/</li>
            <li>Smith, W. B. (2008). Landscape Irrigation Management: Part 6—Soil Type and Irrigation Frequency. Home & Garden Information Center. https://hgic.clemson.edu/factsheet/landscape-irrigation-management-part-6-soil-type-irrigation-frequency/</li>
            <li>State of Queensland. (2014). Water saving tips for your garden. Department of Energy and Water Supply. https://www.resources.qld.gov.au/__data/assets/pdf_file/0006/1407561/water-saving-tips-garden.pdf</li>
            <li>StockCake. (n.d.). Gardening with worms [Photograph]. StockCake. https://images.stockcake.com/public/5/8/6/5862358d-25b8-4809-83db-e3765856ab19/gardening-with-worms-stockcake.jpg</li>
            <li>StockCake. (n.d.). Urban balcony garden [Photograph]. StockCake. https://images.stockcake.com/public/3/7/b/37b156c1-43f8-4b9f-a48f-603d001a765d/urban-balcony-garden-stockcake.jpg</li>
            <li>StockCake. (n.d.). Verdant garden beds [Photograph]. StockCake. https://images.stockcake.com/public/c/9/9/c997ed0c-75f7-468b-9416-2270bb438a1d/verdant-garden-beds-stockcake.jpg</li>
            <li>Syme, G. J., Shao, Q., Po, M., & Campbell, E. (2004). Predicting and understanding home garden water use. Landscape and Urban Planning, 68(1), 121–128. https://doi.org/10.1016/j.landurbplan.2003.08.002</li>
            <li>Tesselaar. (n.d.). Best Way to Water Garden. Tesselaar. https://www.tesselaar.net.au/resources/best-way-to-water-garden</li>
            <li>The Seed Collection. (2025). Sowing Chart. The Seed Collection. https://www.theseedcollection.com.au/Sowing-Chart</li>
            <li>United Nations Framework Convention on Climate Change. (2024). Food loss and waste account for 8-10% of annual global greenhouse gas emissions; cost USD 1 trillion annually. United Nations Climate Change. https://unfccc.int/news/food-loss-and-waste-account-for-8-10-of-annual-global-greenhouse-gas-emissions-cost-usd-1-trillion</li>
            <li>University of California Agriculture and Natural Resources. (n.d.). Types of Irrigation Systems. UCANR. https://ucanr.edu/site/uc-marin-master-gardeners/types-irrigation-systems</li>
            <li>University of Massachusetts Amherst. (2018). Garden types [Image]. UMass Amherst. https://bpb-us-e2.wpmucdn.com/websites.umass.edu/dist/2/23786/files/2018/08/garden-types-sm-032.jpg</li>
            <li>University of Massachusetts Amherst. (2018). Panoramic compost heap [Photograph]. UMass Amherst. https://bpb-us-e2.wpmucdn.com/websites.umass.edu/dist/2/23786/files/2018/08/pano-sm-2.jpg</li>
            <li>Vanheems, B. (2018). How and When to Water Your Plants. https://www.growveg.com.au/guides/how-and-when-to-water-your-plants/</li>
            <li>Victoria State Government. (2013). Climate Trends in Victoria. South West Climate Change Portal. https://www.swclimatechange.com.au/cb_pages/climate_trends_vic.php</li>
            <li>Victoria State Government. (2025). Pest Insects and Mites. Agriculture Victoria. https://agriculture.vic.gov.au/biosecurity/pest-insects-and-mites</li>
            <li>Wadescapes Landscaping. (2023, June). Raised vegetable garden [Photograph]. Wadescapes. https://wadescapes.com/wp-content/uploads/2023/06/iStock-1215726927.jpg</li>
            <li>Waterwise Programs. (2025). Save Water with Seasonal Adjustment: Victoria, Australia. Waterwise Programs. https://www.waterwiseprograms.com.au/save-water-with-seasonal-adjustment-victoria-australia</li>
            <li>Wikimedia Commons. (n.d.). Spring landscape design NYC [Photograph]. Wikimedia Commons. https://upload.wikimedia.org/wikipedia/commons/a/a3/Spring_Landscape_Design_NYC.jpeg</li>
            <li>Wikimedia Commons. (n.d.). Straw bale gardening [Photograph]. Wikimedia Commons. https://upload.wikimedia.org/wikipedia/commons/c/cf/Strohballengarten%2C_Strohballenkultur%2C_Straw_bale_b.jpg</li>
            <li>YouTube. (n.d.). Sustainable gardening playlist [YouTube playlist]. YouTube. https://youtube.com/playlist?list=PLYdRxE9m5LdlZsSbe2I48uR1tWED30X_t&si=VCucijykqvKdSyuU</li>
            <li>Z&Z Landscaping. (2023). Rock delivery and install [Photograph]. Z&Z Landscaping. https://cdn.prod.website-files.com/6520ca581f993b38bba9de71/6523e1c6ea4ee30f9c2f0ba0_rock-delivery-and-install.jpg</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 