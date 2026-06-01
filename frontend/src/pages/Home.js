import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";
import { useData } from "../context/DataContext";
import { FaCommentDots } from "react-icons/fa";

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

const getTagIcon = (tag) => {
  switch(tag.toLowerCase()) {
    case 'react': return <i className="fab fa-react" style={{ fontSize: "12px" }}></i>;
    case 'node.js': return <i className="fab fa-node-js" style={{ fontSize: "12px" }}></i>;
    case 'aws': return <i className="fab fa-aws" style={{ fontSize: "12px" }}></i>;
    case 'python': return <i className="fab fa-python" style={{ fontSize: "12px" }}></i>;
    case 'figma': return <i className="fab fa-figma" style={{ fontSize: "12px" }}></i>;
    case 'ux': return <i className="fas fa-paint-brush" style={{ fontSize: "12px" }}></i>;
    default: return <i className="fas fa-tag" style={{ fontSize: "12px" }}></i>;
  }
};

export default function Home() {
  const { mentors } = useData();
  const featuredMentors = mentors.slice(0, 4);

  return (
    <>
      <Navbar />
      <PageTransition>
        <section className="hero">
          <div className="hero-bg"></div>
          <div className="hero-bg-pattern"></div>

          <div className="container">
            <div className="hero-inner">
              <div className="hero-content">
                <div className="hero-eyebrow animate-fade-up">
                  <div className="hero-eyebrow-line"></div>
                  <span>India's #1 Student Mentorship Platform</span>
                </div>

                <h1 className="animate-fade-up-1">
                  Find Your <em>Perfect</em><br />Mentor Today
                </h1>

                <p className="hero-desc animate-fade-up-2">
                  Connect with industry professionals who've walked your path.
                  Get personalized guidance, career clarity, and real-world
                  insights from mentors at top companies.
                </p>

                <div className="hero-actions animate-fade-up-3">
                  <Link to="/mentors" className="btn-primary">Browse Mentors →</Link>
                  <Link to="/signup"  className="btn-outline">Become a Mentor</Link>
                </div>

                <div className="hero-stats animate-fade-up-4">
                  <div>
                    <div className="hero-stat-num">500<span>+</span></div>
                    <div className="hero-stat-label">Expert Mentors</div>
                  </div>
                  <div>
                    <div className="hero-stat-num">10k<span>+</span></div>
                    <div className="hero-stat-label">Students Helped</div>
                  </div>
                  <div>
                    <div className="hero-stat-num">4.9<span>★</span></div>
                    <div className="hero-stat-label">Average Rating</div>
                  </div>
                </div>
              </div>

              <div className="hero-visual animate-fade-right">
                <div className="hero-card-stack">
                  <div className="hero-card card-1">
                    <div className="mentor-avatar">
                      <i className="fas fa-user-tie" style={{ fontSize: "24px" }}></i>
                    </div>
                    <div className="mentor-card-name">Priya Sharma</div>
                    <div className="mentor-card-role">Product Manager · Google</div>
                    <span className="mentor-card-tag">⭐ 4.9 · 128 reviews</span>
                  </div>
                  <div className="hero-card card-2">
                    <div className="mentor-avatar" style={{ background: "rgba(255,255,255,0.2)" }}>
                      <i className="fas fa-code" style={{ fontSize: "24px" }}></i>
                    </div>
                    <div className="mentor-card-name">Arjun Mehta</div>
                    <div className="mentor-card-role">SWE · Microsoft</div>
                    <span className="mentor-card-tag">✓ Available Now</span>
                  </div>
                  <div className="hero-card card-3">
                    <div className="mentor-avatar" style={{ background: "rgba(201,168,76,0.2)" }}>
                      <i className="fas fa-chart-line" style={{ fontSize: "24px" }}></i>
                    </div>
                    <div className="mentor-card-name">Sneha Patel</div>
                    <div className="mentor-card-role">Data Science · Amazon</div>
                    <span className="mentor-card-tag">🔥 Top Rated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="company-marquee">
          <div className="container">
            <p className="marquee-title">Mentors from world-class companies</p>
            <div className="marquee-wrapper">
              <div className="marquee-content">
                {[
                  { name: "Google", icon: "fab fa-google" },
                  { name: "Microsoft", icon: "fab fa-microsoft" },
                  { name: "Amazon", icon: "fab fa-amazon" },
                  { name: "Meta", icon: "fab fa-meta" },
                  { name: "Flipkart", icon: "fas fa-shopping-cart" },
                  { name: "Zomato", icon: "fas fa-utensils" },
                  { name: "Razorpay", icon: "fas fa-credit-card" },
                  { name: "Swiggy", icon: "fas fa-motorcycle" }
                ].map((company, idx) => (
                  <div className="marquee-item" key={idx}>
                    <i className={company.icon}></i>
                    <span>{company.name}</span>
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {[
                  { name: "Google", icon: "fab fa-google" },
                  { name: "Microsoft", icon: "fab fa-microsoft" },
                  { name: "Amazon", icon: "fab fa-amazon" },
                  { name: "Meta", icon: "fab fa-meta" },
                  { name: "Flipkart", icon: "fas fa-shopping-cart" },
                  { name: "Zomato", icon: "fas fa-utensils" },
                  { name: "Razorpay", icon: "fas fa-credit-card" },
                  { name: "Swiggy", icon: "fas fa-motorcycle" }
                ].map((company, idx) => (
                  <div className="marquee-item" key={`dup-${idx}`}>
                    <i className={company.icon}></i>
                    <span>{company.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="section how-it-works" id="how">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Simple Process</span>
              <h2>How MentorConnect Works</h2>
              <p>Three simple steps to find your ideal mentor and start transforming your career journey.</p>
            </div>
            <div className="steps-grid">
              {[
                { n: "01", title: "Create Your Profile",   desc: "Tell us about your background, goals, and the areas where you need guidance. It takes less than 5 minutes." },
                { n: "02", title: "Browse & Connect",      desc: "Explore curated mentor profiles filtered by domain, company, and expertise. Send a connection request in one click." },
                { n: "03", title: "Grow Together",         desc: "Schedule 1:1 sessions, get personalized roadmaps, and access resources tailored to your career goals." },
              ].map(s => (
                <div className="step-card" key={s.n}>
                  <div className="step-number">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ background: "white" }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Top Mentors</span>
              <h2>Meet Our Featured Mentors</h2>
              <p>Experienced professionals ready to guide you through your career journey with real industry insights.</p>
            </div>

            <div className="mentors-grid">
              {featuredMentors.map(m => (
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
                  <div className="mentor-company">
                    <i className={m.companyIcon || 'fas fa-building'}></i>
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

            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <Link to="/mentors" className="btn-teal">View All Mentors →</Link>
            </div>
          </div>
        </section>

        <section className="section testimonials" id="testimonials">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Success Stories</span>
              <h2>What Our Students Say</h2>
              <p>Real stories from students who transformed their careers with the right mentorship.</p>
            </div>

            <div className="testimonials-grid">
              {[
                {
                  id: 1,
                  name: "Rahul Sharma",
                  role: "Product Designer",
                  company: "Figma",
                  sessions: 12,
                  reviews: 8,
                  text: "My mentor, Priya Sharma, helped me rethink product metrics and design strategy. She shared resources that were immediately applicable. The session was a game-changer for my career.",
                  color: "#667eea"
                },
                {
                  id: 2,
                  name: "Ananya Singh",
                  role: "Software Engineer",
                  company: "Microsoft",
                  sessions: 8,
                  reviews: 5,
                  text: "Arjun Mehta provided tailored guidance on React and Node.js. He created a comfortable environment where I could ask anything. I now feel confident leading frontend projects.",
                  color: "#00d2ff"
                },
                {
                  id: 3,
                  name: "Priya Mehta",
                  role: "Data Scientist",
                  company: "Amazon",
                  sessions: 15,
                  reviews: 12,
                  text: "Sneha Patel is an incredible mentor. She helped me navigate the world of data science and gave me a roadmap to transition into AI. Her insights were invaluable.",
                  color: "#f093fb"
                },
                {
                  id: 4,
                  name: "Vikram Singh",
                  role: "Product Manager",
                  company: "Google",
                  sessions: 10,
                  reviews: 7,
                  text: "I had a session with Priya Sharma about product management. She shared her journey and gave me practical advice on how to break into product. Highly recommended!",
                  color: "#c9a84c"
                },
                {
                  id: 5,
                  name: "Kavya Reddy",
                  role: "UI/UX Designer",
                  company: "Adobe",
                  sessions: 6,
                  reviews: 4,
                  text: "Rohan Gupta is a UX genius. He walked me through design thinking and helped me improve my portfolio. I landed an internship thanks to his mentorship.",
                  color: "#fa709a"
                },
                {
                  id: 6,
                  name: "Amit Patel",
                  role: "DevOps Engineer",
                  company: "Netflix",
                  sessions: 9,
                  reviews: 6,
                  text: "Arjun Mehta helped me understand cloud architecture. He is patient and explains complex topics in a simple way. I highly recommend him!",
                  color: "#e50914"
                }
              ].map(testimonial => (
                <div className="testimonial-card" key={testimonial.id}>
                  <div className="testimonial-avatar" style={{ background: testimonial.color }}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="testimonial-header">
                    <h4>{testimonial.name}</h4>
                    <p className="testimonial-role">{testimonial.role} at {testimonial.company}</p>
                    <div className="testimonial-meta">
                      <span className="sessions">
                        <FaCommentDots className="icon" />
                        {testimonial.sessions} sessions
                      </span>
                      <span className="reviews">({testimonial.reviews} reviews)</span>
                    </div>
                  </div>
                  <div className="testimonial-text">
                    <p>{testimonial.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="cta-banner">
          <div className="container">
            <h2>Ready to Accelerate Your Career?</h2>
            <p>Join thousands of students already learning from the best in the industry.</p>
            <div className="cta-banner-actions">
              <Link to="/signup" className="btn-primary">Start for Free →</Link>
              <Link
                to="/mentors"
                className="btn-outline"
                style={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}
              >
                Explore Mentors
              </Link>
            </div>
          </div>
        </div>

      </PageTransition>
      <Footer />
    </>
  );
}