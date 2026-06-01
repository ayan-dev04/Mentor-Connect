import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://mentor-connect-backend-7djl.onrender.com/api';

const MentorProfile = () => {
  const { id } = useParams();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchMentor = async () => {
      try {
        const response = await fetch(`${API_BASE}/mentors/${id}`);
        if (!response.ok) throw new Error('Mentor not found');
        const data = await response.json();
        setMentor(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentor();
  }, [id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleBookingSuccess = (mentorName) => {
    setToast({ type: 'success', message: `Session booked with ${mentorName}!` });
    // Optionally refresh the mentor data to remove the booked slot
    fetch(`${API_BASE}/mentors/${id}`)
      .then(r => r.json())
      .then(data => setMentor(data))
      .catch(console.error);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
          <h2>Loading mentor profile...</h2>
        </div>
        <Footer />
      </>
    );
  }

  if (!mentor) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
          <h2>Mentor not found</h2>
          <Link to="/mentors" className="btn-primary">Browse Mentors</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        {toast && (
          <div className={`toast-message toast-${toast.type}`}>
            {toast.message}
            <button className="toast-close" onClick={() => setToast(null)}>&times;</button>
          </div>
        )}
        <div className="mentor-profile-container">
          <div className="mentor-profile-hero">
            <div className="mentor-profile-icon" style={{ background: '#c9a84c' }}>
              <img src={mentor.profile_pic} alt={mentor.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <h1>{mentor.name}</h1>
            <p className="mentor-profile-title">{mentor.title} @ {mentor.company}</p>
            <div className="mentor-profile-rating">
              <span className="stars">⭐ {mentor.rating}</span>
              <span className="reviews">({mentor.reviews} reviews)</span>
            </div>
          </div>

          <div className="mentor-profile-content">
            <div className="mentor-bio">
              <h2><i className="fas fa-user-circle"></i> About</h2>
              <p>{mentor.bio || `Experienced ${mentor.title} with expertise in ${(mentor.expertise || []).join(', ')}.`}</p>
            </div>

            <div className="mentor-expertise">
              <h2><i className="fas fa-tags"></i> Expertise</h2>
              <div className="expertise-tags">
                {mentor.expertise?.map(skill => (
                  <span key={skill} className="expertise-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="mentor-stats">
              <div className="stat-card">
                <i className="fas fa-calendar-check"></i>
                <div className="stat-number">{mentor.availableSlots?.length || 0}</div>
                <div className="stat-label">Available Slots</div>
              </div>
              <div className="stat-card">
                <i className="fas fa-star"></i>
                <div className="stat-number">{mentor.rating}</div>
                <div className="stat-label">Rating</div>
              </div>
              <div className="stat-card">
                <i className="fas fa-chalkboard-user"></i>
                <div className="stat-number">{mentor.reviews}</div>
                <div className="stat-label">Reviews</div>
              </div>
            </div>

            <button className="btn-primary book-btn" onClick={() => setShowBooking(true)}>
              <i className="fas fa-calendar-check"></i> Book a Session
            </button>
          </div>
        </div>
      </PageTransition>
      {showBooking && (
        <BookingModal
          mentor={mentor}
          onClose={() => setShowBooking(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
      <Footer />
    </>
  );
};

export default MentorProfile;