import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";
import { useData } from "../context/DataContext";

const RatingStars = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
      {[...Array(fullStars)].map((_, i) => (
        <i key={`full-${i}`} className="fas fa-star" style={{ color: "#c9a84c", fontSize: "12px" }}></i>
      ))}
      {hasHalfStar && <i className="fas fa-star-half-alt" style={{ color: "#c9a84c", fontSize: "12px" }}></i>}
      {[...Array(emptyStars)].map((_, i) => (
        <i key={`empty-${i}`} className="far fa-star" style={{ color: "#c9a84c", fontSize: "12px" }}></i>
      ))}
    </div>
  );
};

export default function Mentors() {
  const { mentors } = useData();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filterMentors = () => {
    let filtered = mentors;
    if (activeFilter !== "all") {
      filtered = filtered.filter(mentor => mentor.category === activeFilter);
    }
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(mentor =>
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.expertise || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered;
  };

  const filteredMentors = filterMentors();
  const handleFilterClick = (filter) => setActiveFilter(filter);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const clearFilters = () => { setActiveFilter("all"); setSearchTerm(""); };

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page-hero mentors-hero">
          <div className="container">
            <span className="section-tag">Find Your Guide</span>
            <h1>Browse Expert Mentors</h1>
            <p>Connect with industry professionals who can help you achieve your career goals</p>
          </div>
        </div>

        <section className="section" style={{ background: "white" }}>
          <div className="container">
            <div className="mentors-filter">
              <button className={`filter-btn ${activeFilter === "all" ? "active" : ""}`} onClick={() => handleFilterClick("all")}>All Mentors</button>
              <button className={`filter-btn ${activeFilter === "product" ? "active" : ""}`} onClick={() => handleFilterClick("product")}><i className="fas fa-chart-simple" style={{ marginRight: "6px" }}></i>Product</button>
              <button className={`filter-btn ${activeFilter === "development" ? "active" : ""}`} onClick={() => handleFilterClick("development")}><i className="fas fa-code" style={{ marginRight: "6px" }}></i>Development</button>
              <button className={`filter-btn ${activeFilter === "datascience" ? "active" : ""}`} onClick={() => handleFilterClick("datascience")}><i className="fas fa-chart-line" style={{ marginRight: "6px" }}></i>Data Science</button>
              <button className={`filter-btn ${activeFilter === "design" ? "active" : ""}`} onClick={() => handleFilterClick("design")}><i className="fas fa-paint-brush" style={{ marginRight: "6px" }}></i>Design</button>
              <button className={`filter-btn ${activeFilter === "marketing" ? "active" : ""}`} onClick={() => handleFilterClick("marketing")}><i className="fas fa-bullhorn" style={{ marginRight: "6px" }}></i>Marketing</button>
              <div className="filter-search">
                <i className="fas fa-search filter-search-icon"></i>
                <input type="text" placeholder="Search by name, role, or skill..." value={searchTerm} onChange={handleSearchChange} />
                {searchTerm && <button onClick={clearFilters} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999" }}><i className="fas fa-times"></i></button>}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem", textAlign: "right" }}>
              <span style={{ fontSize: "0.85rem", color: "#6b6b6b" }}>Showing {filteredMentors.length} of {mentors.length} mentors</span>
            </div>

            <div className="mentors-grid">
              {filteredMentors.map(m => (
                <div className="mentor-card" key={m.id}>
                  <div className="mentor-icon-wrapper" style={{ background: m.color || '#c9a84c' }}>
                    {m.profile_pic ? (
                      <img src={m.profile_pic} alt={m.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <i className={m.icon || 'fas fa-user-circle'} style={{ fontSize: '32px', color: 'white' }}></i>
                    )}
                  </div>
                  <div className="mentor-name">{m.name}</div>
                  <div className="mentor-title">{m.title}</div>
                  <div className="mentor-company" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    <i className={m.companyIcon || 'fas fa-building'} style={{ fontSize: '16px' }}></i>
                    <span>@{m.company}</span>
                  </div>
                  <div className="mentor-tags">
                    {(m.expertise || m.tags || []).map(tag => (
                      <span className="mentor-tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="mentor-rating">
                    <RatingStars rating={m.rating} />
                    <span>{m.rating} ({m.reviews} reviews)</span>
                  </div>
                  <Link to={`/mentor/${m.id}`} className="btn-outline">View Profile</Link>
                </div>
              ))}
            </div>

            {filteredMentors.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                <i className="fas fa-search" style={{ fontSize: "64px", color: "#ddd", marginBottom: "1rem" }}></i>
                <h3 style={{ marginBottom: "0.5rem", color: "#333" }}>No mentors found</h3>
                <p style={{ color: "#6b6b6b", marginBottom: "1.5rem" }}>We couldn't find any mentors matching your criteria.</p>
                <button onClick={clearFilters} className="btn-primary">Clear All Filters</button>
              </div>
            )}
          </div>
        </section>
      </PageTransition>
      <Footer />
    </>
  );
}