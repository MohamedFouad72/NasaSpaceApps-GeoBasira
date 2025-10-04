import React from "react";
import "../CSS/Hero.css"; // Import the CSS file

// Remember to replace with your actual image path
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
      <section className="about-section-container">
        <div className="about-text-content">
          <h2>About GeoBasira</h2>
          <p>
            Air pollution is not just a number on a chart — it is a daily health
            threat that millions face, often without clear guidance on how to
            respond. While satellite missions like NASA's TEMPO, ground-based
            networks like OpenAQ and Pandora, and weather forecasts provide vast
            amounts of data, most of it remains locked behind complex dashboards
            and raw measurements.
          </p>
          <p>
            GeoBasira bridges this gap. Our platform integrates multiple trusted
            data sources – satellites, ground sensors, and weather models – and
            transforms them into clear, actionable insights. Instead of
            overwhelming users with technical datasets, we deliver practical
            guidance: when to cancel outdoor activities, when to issue alerts,
            and how to minimize exposure.
          </p>
          <p>
            With a focus on transparency, accuracy, and usability, GeoBasira
            empowers schools, event organizers, local officials, and communities
            to make the right decisions at the right time. By turning complex
            Earth observation data into simple actions, we bring space science
            closer to everyday life – protecting health, supporting resilience,
            and ensuring that data leads to real-world impact.
          </p>
        </div>
        <div className="about-image-wrapper">
          <div className="cloud-container">
            <img
              src={cloudImage}
              alt="Stylized cloud with lightning and green glow"
              className="cloud-image"
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
