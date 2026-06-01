import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

const TEAM = [
  { id: 1, name: "Nayan Rajora", role: "Co-Founder & CEO", bio: "Passionate about democratizing education and connecting students with industry leaders.", icon: "fas fa-crown", color: "#c9a84c", social: { linkedin: "#", twitter: "#", github: "#" } },
  { id: 2, name: "Ayan Ansari", role: "Co-Founder & CTO", bio: "Full-stack engineer with 10+ years of experience building scalable ed-tech platforms.", icon: "fas fa-code", color: "#1a6b6b", social: { linkedin: "#", twitter: "#", github: "#" } },
  { id: 3, name: "Abhishek Yadav", role: "Head of Design", bio: "Award-winning designer focused on creating intuitive and delightful user experiences.", icon: "fas fa-palette", color: "#e67e22", social: { linkedin: "#", twitter: "#", github: "#" } },
  { id: 4, name: "Ashu Sharma", role: "Head of Growth", bio: "Marketing strategist helping students discover the right mentorship opportunities.", icon: "fas fa-chart-line", color: "#3498db", social: { linkedin: "#", twitter: "#", github: "#" } },
  { id: 5, name: "Priya Mehta", role: "Mentorship Director", bio: "Former Google mentor now leading our mentor onboarding and quality assurance.", icon: "fas fa-chalkboard-user", color: "#9b59b6", social: { linkedin: "#", twitter: "#", github: "#" } },
  { id: 6, name: "Rahul Verma", role: "Community Manager", bio: "Building a thriving community of 10,000+ students and mentors across India.", icon: "fas fa-users", color: "#e74c3c", social: { linkedin: "#", twitter: "#", github: "#" } }
];

const VALUES = [
  { icon: "fas fa-heart", title: "Authentic Connections", desc: "We believe in genuine mentor-mentee relationships built on trust and mutual growth." },
  { icon: "fas fa-chalkboard", title: "Quality Education", desc: "Every mentor is vetted to ensure you get the highest quality guidance." },
  { icon: "fas fa-globe", title: "Global Community", desc: "Connect with mentors from top companies across the world." },
  { icon: "fas fa-chart-line", title: "Career Growth", desc: "Your success is our mission. We're committed to helping you achieve your goals." }
];

const STATS = [
  { number: "500+", label: "Expert Mentors", icon: "fas fa-chalkboard-user" },
  { number: "10k+", label: "Students Helped", icon: "fas fa-user-graduate" },
  { number: "4.9", label: "Average Rating", icon: "fas fa-star" },
  { number: "25+", label: "Partner Companies", icon: "fas fa-building" }
];

export default function About() {
  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page-hero about-hero">
          <div className="container">
            <span className="section-tag">Our Story</span>
            <h1>People Behind MentorConnect</h1>
            <p>A passionate team of educators, engineers, and mentorship advocates building the future of career guidance.</p>
          </div>
        </div>

        <section className="section" style={{ background: "white" }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Meet The Team</span>
              <h2>Driven by Purpose</h2>
              <p>We're a diverse team united by a common mission – making mentorship accessible to every student in India.</p>
            </div>
            <div className="team-grid">
              {TEAM.map(member => (
                <div className="team-card" key={member.id}>
                  <div className="team-icon-wrapper" style={{ background: member.color }}>
                    <i className={member.icon} style={{ fontSize: "36px", color: "white" }}></i>
                  </div>
                  <h3 className="team-name">{member.name}</h3>
                  <div className="team-role">{member.role}</div>
                  <p className="team-bio">{member.bio}</p>
                  <div className="team-social">
                    <a href={member.social.linkedin} className="team-social-link" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in"></i></a>
                    <a href={member.social.twitter} className="team-social-link" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
                    <a href={member.social.github} className="team-social-link" target="_blank" rel="noopener noreferrer"><i className="fab fa-github"></i></a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section stats-section" style={{ background: "linear-gradient(135deg, #0d1f1f 0%, #0d0d0d 100%)", color: "white" }}>
          <div className="container">
            <div className="stats-grid">
              {STATS.map((stat, index) => (
                <div className="stat-card" key={index}>
                  <div className="stat-icon"><i className={stat.icon}></i></div>
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ background: "white" }}>
          <div className="container">
            <div className="values-grid">
              <div className="values-content">
                <span className="section-tag">Our Values</span>
                <h2>What Drives Us Forward</h2>
                <p>These core principles guide everything we do at MentorConnect, from product development to community building.</p>
                <div className="values-list">
                  {VALUES.map((value, index) => (
                    <div className="value-item" key={index}>
                      <div className="value-icon"><i className={value.icon}></i></div>
                      <div>
                        <h4>{value.title}</h4>
                        <p>{value.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="values-image">
                <div className="mission-card">
                  <i className="fas fa-quote-left" style={{ fontSize: "32px", color: "#c9a84c", marginBottom: "1rem", opacity: 0.5 }}></i>
                  <p style={{ fontSize: "1.2rem", lineHeight: "1.6", marginBottom: "1.5rem", fontStyle: "italic" }}>
                    "Every student deserves access to guidance from someone who's been where they want to go."
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg, #c9a84c, #1a6b6b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fas fa-handshake" style={{ color: "white", fontSize: "24px" }}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold" }}>Our Mission</div>
                      <div style={{ fontSize: "0.85rem", color: "#6b6b6b" }}>Making mentorship accessible to all</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section cta-light" style={{ background: "#f5f0e8" }}>
          <div className="container">
            <div className="join-team">
              <div className="join-team-content">
                <span className="section-tag">Join Us</span>
                <h2>Want to Make a Difference?</h2>
                <p>We're always looking for passionate individuals to join our mission. Be part of something meaningful.</p>
                <Link to="/careers" className="btn-primary">View Open Positions →</Link>
              </div>
              <div className="join-team-icon">
                <i className="fas fa-hands-helping" style={{ fontSize: "80px", color: "#c9a84c", opacity: 0.6 }}></i>
              </div>
            </div>
          </div>
        </section>
      </PageTransition>
      <Footer />
    </>
  );
}