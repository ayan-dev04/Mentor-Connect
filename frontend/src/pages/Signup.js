import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://mentor-connect-backend-7djl.onrender.com/api';

export default function Signup() {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    company: "",
    title: "",
    experience_years: "",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateProfilePic = (name) => {
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128`;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.role === "mentor" && (!formData.company || !formData.title || !formData.experience_years)) {
      setError("Please fill all mentor details");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role: formData.role,
        profile_pic: generateProfilePic(formData.name),
      };
      if (formData.role === "mentor") {
        payload.company = formData.company;
        payload.title = formData.title;
        payload.experience_years = parseInt(formData.experience_years);
      }
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(formData.email, otp);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role: formData.role,
        profile_pic: generateProfilePic(formData.name),
      };
      if (formData.role === "mentor") {
        payload.company = formData.company;
        payload.title = formData.title;
        payload.experience_years = parseInt(formData.experience_years);
      }
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to resend OTP');
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
                  background: "linear-gradient(135deg, #1a6b6b, #c9a84c)",
                  borderRadius: "16px", display: "flex", alignItems: "center",
                  justifyContent: "center", marginBottom: "1.5rem"
                }}>
                  <i className="fas fa-rocket" style={{ fontSize: "32px", color: "white" }}></i>
                </div>
                <h2>Start Your Journey Today</h2>
                <p>Join thousands of students who found their perfect mentor and accelerated their career.</p>
              </div>
              <div className="auth-visual-features">
                <div className="auth-feature"><div className="auth-feature-icon"><i className="fas fa-user-graduate"></i></div><span>Get matched with industry experts</span></div>
                <div className="auth-feature"><div className="auth-feature-icon"><i className="fas fa-road"></i></div><span>Personalized career roadmap</span></div>
                <div className="auth-feature"><div className="auth-feature-icon"><i className="fas fa-video"></i></div><span>1-on-1 video mentorship sessions</span></div>
                <div className="auth-feature"><div className="auth-feature-icon"><i className="fas fa-certificate"></i></div><span>Earn skill badges and certificates</span></div>
              </div>
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-form-box">
              <h1>Create account</h1>
              <p className="auth-subtitle">Already have an account? <Link to="/login">Log in here</Link></p>

              {step === 1 && (
                <form onSubmit={handleSendOtp}>
                  {error && <div className="error-message" style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" name="name" className="form-input" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" name="email" className="form-input" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input type="password" name="password" className="form-input" placeholder="Create a password" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <input type="password" name="confirmPassword" className="form-input" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">I am a</label>
                    <div style={{ display: "flex", gap: "2rem", marginTop: "0.5rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input type="radio" name="role" value="student" checked={formData.role === "student"} onChange={handleChange} style={{ width: "18px", height: "18px" }} />
                        <span>Student</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input type="radio" name="role" value="mentor" checked={formData.role === "mentor"} onChange={handleChange} style={{ width: "18px", height: "18px" }} />
                        <span>Mentor</span>
                      </label>
                    </div>
                  </div>

                  {formData.role === "mentor" && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Company</label>
                        <input type="text" name="company" className="form-input" placeholder="e.g., Google, Microsoft" value={formData.company} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input type="text" name="title" className="form-input" placeholder="e.g., Senior Product Manager" value={formData.title} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Years of Experience</label>
                        <input type="number" name="experience_years" className="form-input" placeholder="e.g., 5" value={formData.experience_years} onChange={handleChange} required />
                      </div>
                    </>
                  )}

                  <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <input type="checkbox" id="terms" required style={{ width: "16px", height: "16px" }} />
                    <label htmlFor="terms" style={{ fontSize: "0.85rem", cursor: "pointer", color: "#6b6b6b" }}>
                      I agree to the <Link to="/terms" style={{ color: "#1a6b6b" }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: "#1a6b6b" }}>Privacy Policy</Link>
                    </label>
                  </div>
                  <button type="submit" className="btn-primary form-submit" disabled={loading}>
                    {loading ? "Sending OTP..." : "Continue"}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleVerifyOtp}>
                  {error && <div className="error-message" style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
                  <div className="form-group">
                    <label className="form-label">OTP Verification</label>
                    <p style={{ fontSize: "0.85rem", color: "#6b6b6b", marginBottom: "0.5rem" }}>
                      We've sent a 6-digit code to {formData.email}
                    </p>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary form-submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                  <button
                    type="button"
                    className="btn-outline form-submit"
                    style={{ marginTop: "0.5rem" }}
                    onClick={resendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}