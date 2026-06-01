import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import FeedbackForm from '../../components/FeedbackForm';
import PageTransition from '../../components/PageTransition';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#c9a84c', '#1a6b6b'];

const StudentDashboard = () => {
  const { user } = useAuth();
  const {
    mentors,
    bookings,
    getMentorById,
    getFeedbackByBooking,
    cancelBooking,
    addFeedback,
    refreshBookings,
    loading,      // from context (data loading)
    dataReady,    // from context
  } = useData();

  // bookings from context already belong to this student only
  const upcoming  = bookings.filter(b => b.status === 'upcoming');
  const completed = bookings.filter(b => b.status === 'completed');

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFeedback, setShowFeedback]       = useState(false);
  const [actionLoading, setActionLoading]     = useState(false); // renamed to avoid conflict
  const [toast, setToast]                     = useState(null);

  // Refresh on mount so data is always fresh
  useEffect(() => {
    refreshBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (type, message) => setToast({ type, message });

  const handleCancelBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      await cancelBooking(bookingId);
      showToast('success', 'Session cancelled successfully!');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedbackSubmit = async (rating, comment) => {
    try {
      await addFeedback(selectedBooking.id, rating, comment);
      setShowFeedback(false);
      setSelectedBooking(null);
      showToast('success', 'Thank you for your feedback!');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  // Chart data
  const sessionsOverTime = bookings
    .reduce((acc, b) => {
      const date = new Date(b.slot).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) existing.count++;
      else acc.push({ date, count: 1 });
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pieData = [
    { name: 'Upcoming',  value: upcoming.length  },
    { name: 'Completed', value: completed.length },
  ];

  // Wait for data to be fully loaded
  if (loading || !dataReady) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="dashboard-container" style={{ paddingTop: '80px' }}>

        {/* Toast */}
        {toast && (
          <div className={`toast-message toast-${toast.type}`}>
            {toast.message}
            <button className="toast-close" onClick={() => setToast(null)}>&times;</button>
          </div>
        )}

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {user?.name} 👋</h1>
            <p>Track your mentorship journey and upcoming sessions</p>
          </div>
          <div className="date-widget">
            <i className="far fa-calendar-alt"></i>{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          <div className="stat-card-dashboard">
            <div className="stat-title">Total Sessions</div>
            <div className="stat-value">{bookings.length}</div>
            <i className="fas fa-chalkboard-user stat-icon"></i>
          </div>
          <div className="stat-card-dashboard">
            <div className="stat-title">Upcoming</div>
            <div className="stat-value">{upcoming.length}</div>
            <i className="fas fa-calendar-week stat-icon"></i>
          </div>
          <div className="stat-card-dashboard">
            <div className="stat-title">Completed</div>
            <div className="stat-value">{completed.length}</div>
            <i className="fas fa-check-circle stat-icon"></i>
          </div>
        </div>

        {/* Charts */}
        <div className="dashboard-main">
          <div className="dashboard-card">
            <h3><i className="fas fa-chart-line"></i> Session Activity Over Time</h3>
            {sessionsOverTime.length === 0 ? (
              <p style={{ color: 'var(--muted)', padding: '2rem 0', textAlign: 'center' }}>
                No session data yet. Book a session to see your activity!
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sessionsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#c9a84c" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="dashboard-card">
            <h3><i className="fas fa-chart-pie"></i> Session Status</h3>
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--muted)', padding: '2rem 0', textAlign: 'center' }}>
                No sessions yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Upcoming & Past sessions */}
        <div className="dashboard-main">
          <div className="dashboard-card">
            <h3><i className="fas fa-calendar-alt"></i> Upcoming Sessions</h3>
            {upcoming.length === 0 ? (
              <p>No upcoming sessions. <Link to="/mentors">Find a mentor →</Link></p>
            ) : (
              <table className="session-table">
                <thead>
                  <tr>
                    <th>Mentor</th>
                    <th>Date &amp; Time</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map(b => {
                    const mentor = getMentorById(b.mentor_id);
                    return (
                      <tr key={b.id}>
                        <td>
                          <strong>{mentor?.name || 'Mentor Unavailable'}</strong><br />
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                            {mentor?.title}
                          </span>
                        </td>
                        <td>
                          {new Date(b.slot).toLocaleDateString()}<br />
                          {new Date(b.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <button
                            className="btn-outline"
                            style={{ padding: '0.2rem 0.8rem' }}
                            onClick={() => handleCancelBooking(b.id)}
                            disabled={actionLoading}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="dashboard-card">
            <h3><i className="fas fa-history"></i> Past Sessions</h3>
            {completed.length === 0 ? (
              <p>No past sessions yet.</p>
            ) : (
              <table className="session-table">
                <thead>
                  <tr>
                    <th>Mentor</th>
                    <th>Date</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map(b => {
                    const mentor = getMentorById(b.mentor_id);
                    const fb     = getFeedbackByBooking(b.id);
                    return (
                      <tr key={b.id}>
                        <td>
                          <strong>{mentor?.name || 'Mentor Unavailable'}</strong><br />
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                            {mentor?.title}
                          </span>
                        </td>
                        <td>{new Date(b.slot).toLocaleDateString()}</td>
                        <td>
                          {fb ? (
                            <span className="feedback-badge">⭐ {fb.rating}/5</span>
                          ) : (
                            <button
                              className="btn-primary"
                              style={{ padding: '0.2rem 0.8rem', fontSize: '0.75rem' }}
                              onClick={() => { setSelectedBooking(b); setShowFeedback(true); }}
                            >
                              Rate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recommendations + Activity + Profile */}
        <div className="dashboard-main">
          <div className="dashboard-card">
            <h3><i className="fas fa-star"></i> Recommended for You</h3>
            <div className="recommendation-list">
              {mentors.slice(0, 3).map(m => (
                <div key={m.id} className="recommendation-item">
                  <div className="recommendation-info">
                    <strong>{m.name}</strong>
                    <p>{m.title} • {m.company}</p>
                  </div>
                  <Link to={`/mentor/${m.id}`} className="btn-outline" style={{ padding: '0.2rem 1rem' }}>
                    View
                  </Link>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <Link to="/mentors" className="btn-outline">See All Mentors →</Link>
            </div>
          </div>

          <div className="dashboard-card">
            <h3><i className="fas fa-bell"></i> Recent Activity</h3>
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No activity yet.</p>
            ) : (
              <ul className="activity-feed">
                {bookings.slice(0, 5).map(b => {
                  const mentor = getMentorById(b.mentor_id);
                  return (
                    <li key={b.id}>
                      <div className="activity-icon">
                        <i className={
                          b.status === 'upcoming'   ? 'fas fa-calendar-check' :
                          b.status === 'completed'  ? 'fas fa-check-circle'   :
                          'fas fa-times-circle'
                        }></i>
                      </div>
                      <div className="activity-text">
                        <div>
                          {b.status === 'upcoming'  ? 'Booked'    :
                           b.status === 'completed' ? 'Completed' : 'Cancelled'}{' '}
                          session with <strong>{mentor?.name || '…'}</strong>
                        </div>
                        <div className="activity-time">
                          {new Date(b.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="dashboard-card">
            <h3><i className="fas fa-user-circle"></i> Your Profile</h3>
            <div className="profile-info">
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
            </div>
            <button className="btn-outline" style={{ marginTop: '1rem' }}>
              Edit Profile
            </button>
          </div>
        </div>

        {/* Feedback modal */}
        {showFeedback && selectedBooking && (
          <FeedbackForm
            onSubmit={handleFeedbackSubmit}
            onClose={() => { setShowFeedback(false); setSelectedBooking(null); }}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;