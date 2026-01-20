import React from "react";
import mahmoudImg from "../assets/mahmoud.png";
import marawanImg from "../assets/marawan.png";
import mohamedImg from "../assets/mohamed.png";
import ahmedImg from "../assets/ahmed.png";
import ebrahimImg from "../assets/ebrahim.jpg";
import "../CSS/About.css";

export default function About() {
    return (
        <div className="about-page">

            {/* Hero Section */}
            <section className="about-hero">
                <h1 className="about-title">
                    About GeoBasira
                </h1>
                <p className="about-desc">
                    Empowering communities with real-time, hyperlocal air quality insights.
                    GeoBasira leverages advanced satellite data and ground sensors to visualize the invisible,
                    helping you make informed decisions for a healthier life.
                </p>
            </section>

            {/* Grid Features */}
            <section className="about-grid-section">
                <Card
                    title="Real-Time Analysis"
                    desc="Instant access to pollutant data including PM2.5, NO2, and Ozone levels in your vicinity."
                    icon="📊"
                />
                <Card
                    title="Health Recommendations"
                    desc="Act upon actionable health advice tailored to current air quality conditions to protect sensitive groups."
                    icon="🏥"
                />
                <Card
                    title="Global Coverage"
                    desc="Seamlessly explore air quality data anywhere in the world with our interactive map interface."
                    icon="🌍"
                />
                <Card
                    title="Data Visualization"
                    desc="Clear, intuitive charts and color-coded indicators make complex environmental data easy to understand."
                    icon="📈"
                />
            </section>

            {/* Team Section */}
            <section className="team-section">
                <h2 className="team-title">
                    Meet Our Team
                </h2>
                <div className="team-grid">
                    <TeamCard
                        name="Ebrahim Rabie"
                        role="Data Science & Visualizations & Python Development"
                        image={ebrahimImg}
                        linkedin="https://www.linkedin.com/in/ebrahim-rabie/"
                    />
                    <TeamCard
                        name="Mohamed Ahmed"
                        role="MERN Stack web development"
                        image={mohamedImg}
                        linkedin="https://www.linkedin.com/in/muhammad-ahmad-6392business980/"
                    />
                    <TeamCard
                        name="Marawan Abdulrahim"
                        role="Data Science & Frontend web development & Python Development"
                        image={marawanImg}
                        linkedin="https://www.linkedin.com/in/marawan-elbalal/"
                    />
                    <TeamCard
                        name="Mahmoud Sakr"
                        role="Data Science & Visualizations & Python Development"
                        image={mahmoudImg}
                        linkedin="https://www.linkedin.com/in/mahmoud-sakr11/"
                    />
                    <TeamCard
                        name="Ahmed Mohdaly"
                        role="UI/UX & Frontend web development"
                        image={ahmedImg}
                        linkedin="https://www.linkedin.com/in/ahmed-mohdaly-cs24/"
                    />
                </div>
            </section>

            {/* Footer / CTA */}
            <div className="about-footer">
                <p>© 2024 GeoBasira. All rights reserved.</p>
            </div>

        </div>
    );
}

function TeamCard({ name, role, image, linkedin }) {
    return (
        <div className="team-card">
            <div className="team-avatar">
                {image ? (
                    <img src={image} alt={name} className="team-img" />
                ) : (
                    "👤"
                )}
            </div>
            <h3 className="team-name">{name}</h3>
            <p className="team-role">{role}</p>

            {linkedin && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                </a>
            )}
        </div>
    );
}

function Card({ title, desc, icon }) {
    return (
        <div className="about-card">
            <div className="about-card-icon">{icon}</div>
            <h3 className="about-card-title">{title}</h3>
            <p className="about-card-desc">{desc}</p>
        </div>
    );
}
