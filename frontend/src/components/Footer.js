import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              Mentor<span>Connect</span>
            </div>
            <p>India's #1 student mentorship platform connecting aspiring minds with industry experts.</p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/mentors">Find Mentors</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/success-stories">Success Stories</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Career Guide</a></li>
              <li><a href="#">Mentorship Tips</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Connect</h4>
            <ul>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Become a Mentor</a></li>
              <li><a href="#">Partnerships</a></li>
              <li><a href="#">Support</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2024 MentorConnect. All rights reserved.</div>
          <div>
            <a href="#" style={{ marginRight: "1rem" }}>Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}