import "../CSS/Hero.css";
import Logo from "../assets/TransparentLogo.png";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-container">
        {/* Left side content */}
        <div className="hero-content">
          <div className="hero-logo">
            <img src={Logo} alt="GeoBasira Logo" />
            <h1>GeoBasira</h1>
          </div>
          <h2 className="hero-title">
            Satellite data that <span>tells you what to do.</span>
          </h2>
          <p className="hero-subtext">
            From NASA to neighborhood: get clear, local alerts for pollution,
            floods and other risks — fast.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">Try Demo</button>
            <button className="btn-secondary">How it works</button>
          </div>
          <div className="hero-trust">
            <span>NASA data</span> • <span>Transparent rules</span> •{" "}
            <span>Local alerts</span>
          </div>
        </div>

        {/* Right side illustration */}
        <div className="hero-illustration">
          <div className="globe"></div>
        </div>
      </div>
    </section>
  );
}
