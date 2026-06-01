import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isActive = (path) => (location.pathname === path ? "active" : "");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === "student") return "/dashboard/student";
    if (user.role === "mentor") return "/dashboard/mentor";
    if (user.role === "admin") return "/dashboard/admin";
    return null;
  };

  return (
    <>
      <nav className={`main-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="main-navbar-container">
          <Link to="/" className="main-navbar-brand">
            Mentor<span className="main-brand-highlight">Connect</span>
          </Link>

          <div className="main-navbar-links">
            <Link to="/" className={`main-nav-link ${isActive("/")}`}>Home</Link>
            <Link to="/mentors" className={`main-nav-link ${isActive("/mentors")}`}>Find Mentors</Link>
            <Link to="/about" className={`main-nav-link ${isActive("/about")}`}>About Us</Link>
            {user && (
              <Link to={getDashboardLink()} className={`main-nav-link ${isActive(getDashboardLink())}`}>
                Dashboard
              </Link>
            )}
          </div>

          <div className="main-navbar-buttons">
            {!user ? (
              <>
                <Link to="/login" className="main-login-btn">Log In</Link>
                <Link to="/signup" className="main-signup-btn">Get Started</Link>
              </>
            ) : (
              <div className="user-menu">
                <div className="user-greeting">
                  <i className="fas fa-user-circle"></i> Hi, {user.name.split(' ')[0]}
                </div>
                <button onClick={handleLogout} className="main-login-btn">Logout</button>
              </div>
            )}
          </div>

          <button className="main-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="main-mobile-menu">
          <Link to="/" className="main-mobile-link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/mentors" className="main-mobile-link" onClick={() => setMenuOpen(false)}>Find Mentors</Link>
          <Link to="/about" className="main-mobile-link" onClick={() => setMenuOpen(false)}>About Us</Link>
          {user && (
            <Link to={getDashboardLink()} className="main-mobile-link" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          )}
          <div className="main-mobile-buttons">
            {!user ? (
              <>
                <Link to="/login" className="main-mobile-login" onClick={() => setMenuOpen(false)}>Log In</Link>
                <Link to="/signup" className="main-mobile-signup" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            ) : (
              <>
                <div className="user-greeting">
                  <i className="fas fa-user-circle"></i> Hi, {user.name.split(' ')[0]}
                </div>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="main-mobile-login">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;