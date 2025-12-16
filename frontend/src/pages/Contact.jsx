import './Contact.css';
// pages/Contact.jsx
import React from 'react';
import './Contact.css'; // See CSS below

const Contact = () => {
  return (
    <section className="contact-section">
      <div className="container">
        {/* Left Side: Info */}
        <div className="contact-info">
          <h1>Let's Grow Together.</h1>
          <p>Have a question about sustainable farming or our products? Drop us a line.</p>
          <div className="social-links">
            <a href="#">Instagram</a>
            <a href="#">Twitter</a>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="contact-form">
          <form>
            <div className="form-group">
              <label>Your Name</label>
              <input type="text" placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="john@example.com" />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea placeholder="Tell us about your needs..."></textarea>
            </div>
            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;