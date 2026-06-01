import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="auth-page">
          <div className="auth-visual">
            <div className="auth-visual-pattern"></div>
            <div className="auth-visual-content">
              <div style={{ marginBottom: "2rem" }}>
                <div style={{
                  width: "60px", height: "60px",
                  background: "linear-gradient(135deg, #c9a84c, #1a6b6b)",
                  borderRadius: "16px", display: "flex", alignItems: "center",
                  justifyContent: "center", marginBottom: "1.5rem"
                }}>
                  <i className="fas fa-handshake" style={{ fontSize: "32px", color: "white" }}></i>
                </div>
                <h2>Welcome Back to MentorConnect</h2>
                <p>Log in to continue your mentorship journey and connect with your guide.</p>
              </div>

              <div className="auth-visual-features">
                <div className="auth-feature"><div className="auth-feature-icon"><i className="fas fa-chalkboard-user"></i></div><span>Access your personalized dashboard</span></div>
                <div className="auth-feature"><div className="auth-feature-icon"><i className="fas fa-calendar-check"></i></div><span>Manage and schedule upcoming sessions</span></div>
                <div className="auth-feature"><div className="auth-feature-icon"><i className="fas fa-comments"></i></div><span>Connect with mentors or mentees</span></div>
                <div className="auth-feature"><div className="auth-feature-icon"><i className="fas fa-chart-line"></i></div><span>Track your progress and milestones</span></div>
              </div>
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-form-box">
              <h1>Welcome back</h1>
              <p className="auth-subtitle">Don't have an account? <Link to="/signup">Sign up for free</Link></p>
              <form onSubmit={handleSubmit}>
                {error && <div className="error-message" style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <label className="form-label">Password</label>
                    <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                  </div>
                  <input type="password" className="form-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary form-submit" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"} <i className="fas fa-arrow-right" style={{ marginLeft: "8px" }}></i>
                </button>
              </form>
              <div className="form-divider">or continue with</div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className="social-btn" onClick={() => console.log("Google login")}><i className="fab fa-google" style={{ fontSize: "18px", color: "#db4437" }}></i> Google</button>
                <button className="social-btn" onClick={() => console.log("GitHub login")}><i className="fab fa-github" style={{ fontSize: "18px" }}></i> GitHub</button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}