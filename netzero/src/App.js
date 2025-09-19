import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScrollFromTop from "./components/ScrollFromTop";

// Import components
import HomePage from './pages/HomePage';
import Weather from './pages/Weather';
import GardenPlan from './pages/GardenPlan';
import AboutPage from './pages/AboutPage';
import PlantDetailPage from './pages/PlantDetailPage';

function App() {
  return (
    <Router>
      <ScrollFromTop />
      <div className="App">
        <Navigation />
        <Routes>
          {/* Default route - direct to current version (iteration2) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/gardenplan" element={<GardenPlan />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/plant-detail/:plantName" element={<PlantDetailPage />} />
          
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
