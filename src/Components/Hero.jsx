import React from "react";
import "../CSS/Hero.css"; // Import the CSS file

import { Link } from "react-router-dom";
import earthImage from "../assets/earth.png";
import cloudImage from "../assets/cloud.png";

const Hero = () => {
  return (
    <>
      <section className="hero-container">
        <div className="hero-text">
          <h1>
            From Complex Maps to Clear Choices, where satellite insights meet
            human Decisions
          </h1>
          <p>Turning Earth Observations Into Clear Actions</p>
          <div style={{ marginTop: 32 }}>
            <Link to="/prototype" className="hero-cta-button">
              Get Started
            </Link>
          </div>
        </div>
        <div className="hero-image-wrapper">
          <div className="earth-container">
            <img
              src={earthImage}
              alt="Stylized globe with a green glow"
              className="earth-image"
            />
          </div>
        </div>
      </section>

      {/* Restored & Improved About Section */}
      <section className="about-section-container">
        <div className="about-text-content">
          <h2>About GeoBasira</h2>
          <p>
            Air pollution is not just a number on a chart — it is a daily health
            threat that millions face, often without clear guidance on how to
            respond.
          </p>
          <p>
            GeoBasira bridges this gap. Our platform integrates multiple trusted
            data sources – satellites, ground sensors, and weather models – and
            transforms them into clear, actionable insights.
          </p>
          <p>
            With a focus on transparency, accuracy, and usability, we empower
            communities to make the right decisions. By turning complex data into
            simple actions, we bring space science closer to everyday life.
          </p>
        </div>
        <div className="about-image-wrapper">
          <div className="cloud-container">
            <img
              src={cloudImage}
              alt="Stylized cloud with lightning"
              className="cloud-image"
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
