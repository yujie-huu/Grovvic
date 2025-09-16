import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CompanionPage.css';

const CompanionPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // go back to previous page
  };

    return (
    <div className="companion-page">
      <button className="back-button" onClick={handleGoBack}>← Back</button>
      <h1 className="compaion-title"> Companion Planting</h1>
      <div className="companion-container">
      </div>
    </div>
    );
};

export default CompanionPage;