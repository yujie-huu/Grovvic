import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import AlertPage from './pages/AlertPage';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alert" element={<AlertPage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
