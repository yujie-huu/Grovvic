import React from "react";
import "./Support.css";

const Support = () => {
  return (
    <div className="support-page">
      <header className="support-header">
        <h1>Need Help?</h1>
        <p>We’re here to support your gardening journey.</p>
      </header>

      <section className="support-section">
        <h2>Frequently Asked Resources</h2>
        <ul className="support-links">
          <li>
            <button
              className="support-link"
              onClick={() => alert("Monash Support coming soon!")}
            >
              Monash University Support
            </button>
          </li>
          <li>
            <button
              className="support-link"
              onClick={() => alert("Gardening FAQ coming soon!")}
            >
              Gardening FAQ
            </button>
          </li>
          <li>
            <button
              className="support-link"
              onClick={() => alert("Technical Support coming soon!")}
            >
              Technical Support
            </button>
          </li>
          <li>
            <button
              className="support-link"
              onClick={() => alert("Contact Team coming soon!")}
            >
              Contact Our Team
            </button>
          </li>
        </ul>
      </section>

      <section className="support-section">
        <h2>Still Need Help?</h2>
        <p>
          Can’t find the answer you’re looking for? Reach out to us and we’ll do
          our best to assist.
        </p>
        <button
          className="support-button"
          onClick={() => alert("Support request form coming soon!")}
        >
          Submit a Request
        </button>
      </section>
    </div>
  );
};

export default Support;
