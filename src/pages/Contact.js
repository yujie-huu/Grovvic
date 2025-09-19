import React from "react";
import "./Contact.css";

const Contact = () => {
  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="hero-text">
          <h1>Contact Us</h1>
          <p>We’d love to hear from you! Reach out for support, questions, or feedback.</p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section">
        <div className="contact-container">
          <h2>Get in Touch</h2>
          <form className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="Enter your name" required />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="Enter your email" required />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" rows="5" placeholder="Write your message..." required></textarea>
            </div>

            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </div>
      </section>

      {/* Info Section */}
      <section className="contact-info">
        <h2>Other Ways to Reach Us</h2>
        <ul>
          <li><strong>Email:</strong> support@netzero.com</li>
          <li><strong>Phone:</strong> +61 3 1234 5678</li>
          <li><strong>Address:</strong> 123 Green Street, Melbourne, VIC</li>
        </ul>
      </section>
    </div>
  );
};

export default Contact;
