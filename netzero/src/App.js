import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScrollFromTop from "./components/ScrollFromTop";

// Import iteration 1 components
import HomePage1 from './pages/iteration_1/HomePage';
import Weather1 from './pages/iteration_1/Weather';
import GardenPlan1 from './pages/iteration_1/GardenPlan';
import AboutPage1 from './pages/iteration_1/AboutPage';
import PlantDetailPage1 from './pages/iteration_1/PlantDetailPage';

// Import iteration 2 components
import HomePage2 from './pages/iteration_2/HomePage';
import Weather2 from './pages/iteration_2/Weather';
import GardenPlan2 from './pages/iteration_2/GardenPlan';
import AboutPage2 from './pages/iteration_2/AboutPage';
import PlantDetailPage2 from './pages/iteration_2/PlantDetailPage';
import Sustain from './pages/iteration_2/Sustain';
import Composting from './pages/iteration_2/CompostingQuizPage';
import Biodiversity from './pages/iteration_2/Biodiversity';
import Companion from './pages/iteration_2/CompanionPage';
import Support from './pages/iteration_2/Support';
import Contact from './pages/iteration_2/Contact';

function App() {
  return (
    <Router>
      <ScrollFromTop />
      <div className="App">
        <Navigation />
        <Routes>
          {/* Default route - direct to current version (iteration2) */}
          <Route path="/" element={<HomePage2 />} />
          <Route path="/weather" element={<Weather2 />} />
          <Route path="/gardenplan" element={<GardenPlan2 />} />
          <Route path="/about" element={<AboutPage2 />} />
          <Route path="/plant-detail/:plantName" element={<PlantDetailPage2 />} />
          
          
          {/* Iteration 1 routes */}
          <Route path="/iteration1" element={<HomePage1 />} />
          <Route path="/iteration1/weather" element={<Weather1 />} />
          <Route path="/iteration1/gardenplan" element={<GardenPlan1 />} />
          <Route path="/iteration1/about" element={<AboutPage1 />} />
          <Route path="/iteration1/plant-detail/:plantName" element={<PlantDetailPage1 />} />
          
          {/* Iteration 2 routes */}
          <Route path="/iteration2" element={<HomePage2 />} />
          <Route path="/iteration2/weather" element={<Weather2 />} />
          <Route path="/iteration2/gardenplan" element={<GardenPlan2 />} />
          <Route path="/iteration2/about" element={<AboutPage2 />} />
          <Route path="/iteration2/plant-detail/:plantName" element={<PlantDetailPage2 />} />
          <Route path="/iteration2/sustain" element={<Sustain />} />
          <Route path="/iteration2/companion" element={<Companion />} />
          <Route path="/iteration2/composting" element={<Composting />} />
          <Route path="/iteration2/biodiversity" element={<Biodiversity />} />
          <Route path="/iteration2/support" element={<Support />} />
          <Route path="/iteration2/Contact" element={<Contact />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
