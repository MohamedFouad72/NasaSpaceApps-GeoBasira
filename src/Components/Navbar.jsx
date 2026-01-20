import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/TransparentLogo.png";
import "../CSS/navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-left">
          <button
            className="navbar-hamburger"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <span className={`hamburger-line ${open ? "open" : ""}`} />
            <span className={`hamburger-line ${open ? "open" : ""}`} />
            <span className={`hamburger-line ${open ? "open" : ""}`} />
          </button>
          <Link to="/" className="navbar-logo">
            <img src={Logo} alt="GeoBasira Logo" />
            <span>GeoBasira</span>
          </Link>
        </div>

        {/* Links (desktop) */}
        <nav
          className={`navbar-links ${open ? "open" : ""}`}
          aria-hidden={!open && window.innerWidth < 768}
        >
          <ul>
            <li>
              <Link to="/" onClick={handleLinkClick}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/prototype" onClick={handleLinkClick}>
                App
              </Link>
            </li>
            <li>
              <Link to="/about" onClick={handleLinkClick}>
                About
              </Link>
            </li>
          </ul>

          <div className="navbar-action-mobile">

          </div>
        </nav>

        {/* Desktop action button */}
        <div className="navbar-action">
          <Link to="/prototype">
            <button>Get Started</button>
          </Link>
        </div>
      </div>

      {/* Mobile menu backdrop (click to close) */}
      {open && (
        <div className="navbar-backdrop" onClick={() => setOpen(false)} />
      )}
    </header>
  );
}
