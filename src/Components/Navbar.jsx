import { Link } from "react-router-dom";
import Logo from "../assets/TransparentLogo.png";
import "../CSS/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <img src={Logo} alt="GeoBasira Logo" />
          <span>GeoBasira</span>
        </div>

        {/* Links */}
        <ul className="navbar-links">
          <li>
            <Link to="/">Home</Link>
          </li>

          <li>
            <Link to="/prototype">App</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>

        {/* Button */}
        <div className="navbar-action">
          <button>Get Started</button>
        </div>
      </div>
    </nav>
  );
}
