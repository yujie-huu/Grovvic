import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScrollFromTop from "./components/ScrollFromTop";
import BackToTopButton from "./components/BackToTopButton";

// Import iteration 2 components
import HomePage from './pages/HomePage';
import Weather from './pages/Weather';
import GardenPlan from './pages/GardenPlan';
import AboutPage from './pages/AboutPage';
import PlantDetailPage from './pages/PlantDetailPage';
import Sustain from './pages/Sustain';
import Composting from './pages/CompostingQuizPage';
import Biodiversity from './pages/Biodiversity';
import Companion from './pages/CompanionPage';
import Support from './pages/Support';
import AnimalDetail from "./pages/AnimalDetail";
import GardeningType from "./pages/GardenType";
import SimulationPage from './pages/SimulationPage';

function App() {
  return (
    <Router>
      <ScrollFromTop />
      <div className="App">
        <Navigation />
        <Routes>          
          {/* routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/gardenplan" element={<GardenPlan />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/plant-detail/:plantName" element={<PlantDetailPage />} />
          <Route path="/sustain" element={<Sustain />} />
          <Route path="/companion" element={<Companion />} />
          <Route path="/composting" element={<Composting />} />
          <Route path="/biodiversity" element={<Biodiversity />} />
          <Route path="/support" element={<Support />} />
          <Route path="/animal/:name" element={<AnimalDetail />} />
          <Route path="/gardening/:type" element={<GardeningType />} />
          <Route path="/simulation" element={<SimulationPage />} />
        </Routes>
        <Footer />
        <BackToTopButton />
      </div>
    </Router>
  );
}

export default App;
