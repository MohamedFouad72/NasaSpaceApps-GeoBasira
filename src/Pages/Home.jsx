import React from "react";
import Hero from "../Components/Hero";
import { Link } from "react-router-dom";
import "../CSS/Home.css";

const Home = () => {
  return (
    <div style={{ overflowX: "hidden" }}>
      {/* 1. Hero Section (Existing) */}
      <Hero />

      {/* 2. Features Section */}
      <section className="home-section">
        <div className="home-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose GeoBasira?</h2>
            <p className="section-subtitle">
              We combine NASA satellite data with local sensors to give you the most accurate air quality picture.
            </p>
          </div>

          <div className="features-grid">
            <FeatureCard
              icon="🛰️"
              title="Satellite Precision"
              desc="Leveraging NASA's TEMPO and Sentinel data for high-resolution atmospheric monitoring."
            />
            <FeatureCard
              icon="⚡"
              title="Real-Time Updates"
              desc="Live data streams ensure you know exactly what you're breathing, right now."
            />
            <FeatureCard
              icon="🛡️"
              title="Health First"
              desc="Personalized recommendations to protect you and your family from harmful pollutants."
            />
          </div>
        </div>
      </section>

      {/* 3. Stats / Impact Section */}
      <section className="home-section alt-bg">
        <div className="home-container">
          <div className="stats-grid">
            <StatItem value="100+" label="Cities Monitored" />
            <StatItem value="24/7" label="Data Availability" />
            <StatItem value="NASA" label="Powered Technology" />
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="home-section">
        <div className="home-container">
          <h2 className="section-title" style={{ textAlign: "center", marginBottom: "60px" }}>How It Works</h2>
          <div className="steps-container">
            <Step
              number="01"
              title="Select Your Location"
              desc="Click anywhere on our interactive global map to pinpoint your exact location."
              align="left"
            />
            <Step
              number="02"
              title="Get Instant Analysis"
              desc="View detailed breakdowns of PM2.5, NO2, Ozone, and other critical pollutants."
              align="right"
            />
            <Step
              number="03"
              title="Take Action"
              desc="Follow our health recommendations to minimize exposure and stay safe."
              align="left"
            />
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to Breathe Better?</h2>
        <p className="cta-text">
          Join thousands of users who trust GeoBasira for their daily air quality insights.
        </p>
        <Link to="/prototype">
          <button className="cta-button">
            Launch Map
          </button>
        </Link>
      </section>

      {/* 6. Footer */}
      <footer className="footer-section">
        <div className="footer-grid">
          <div className="footer-col">
            <h3>GeoBasira</h3>
            <p>Visualizing the invisible for a healthier planet.</p>
          </div>
          <div className="footer-col">
            <h4>Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/prototype">App</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Team</h4>
            <p>Developed for NASA Space Apps Challenge.</p>
          </div>
        </div>
        <div className="footer-bottom">
          © 2024 GeoBasira. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// --- Subcomponents ---

const FeatureCard = ({ icon, title, desc }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{desc}</p>
  </div>
);

const StatItem = ({ value, label }) => (
  <div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const Step = ({ number, title, desc, align }) => (
  <div className={`step-item ${align === "right" ? "right" : ""}`}>
    <div className="step-number">
      {number}
    </div>
    <div className="step-content" style={{ flex: 1 }}>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  </div>
);

export default Home;
