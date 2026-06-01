import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import PageTransition from '../../components/PageTransition';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

const MentorDashboard = () => {
  const { user } = useAuth();
  const {
    mentors,
    bookings,
    students,
    getStudentById,
    getFeedbackByBooking,
    getAverageRatingForMentor,
    completeSession,
    cancelBooking,
    addAvailabilitySlot,
    removeAvailabilitySlot,
    refreshBookings,
    refreshMentors,
    refreshStudents,
    loading,      // from context (data loading)
    dataReady,    // from context
  } = useData();

  // bookings from context already belong to this mentor only
  const upcoming  = bookings.filter(b => b.status === 'upcoming');
  const completed = bookings.filter(b => b.status === 'completed');

  // Mentor's own profile data from the mentors list
  const mentor = mentors.find(m => m.id === user?.id) || null;

  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false); // renamed to avoid conflict
  const [toast, setToast] = useState(null);

  // Refresh on mount
  useEffect(() => {
    refreshBookings();
    refreshMentors();
    if (refreshStudents) refreshStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (type, message) => setToast({ type, message });

  const handleAddSlot = async () => {
    if (!newSlotDate || !newSlotTime) {
      showToast('error', 'Please select both date and time.');
      return;
    }
    try {
      await addAvailabilitySlot(`${newSlotDate}T${newSlotTime}`);
      setNewSlotDate('');
      setNewSlotTime('');
      showToast('success', 'Availability slot added!');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const handleRemoveSlot = async (slot) => {
    try {
      await removeAvailabilitySlot(slot);
      showToast('success', 'Slot removed.');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const handleCompleteSession = async (bookingId) => {
    setActionLoading(true);
    try {
      await completeSession(bookingId);
      showToast('success', 'Session marked as completed!');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      await cancelBooking(bookingId);
      showToast('success', 'Session cancelled.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
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

  const ratings      = completed.map(b => getFeedbackByBooking(b.id)).filter(Boolean);
  const ratingCounts = [1, 2, 3, 4, 5].map(r => ({
    rating: `${r}★`,
    count:  ratings.filter(f => f.rating === r).length,
  }));

  const avgRating = getAverageRatingForMentor(mentor?.id);

  // Wait for data to be fully loaded
  if (loading || !dataReady) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <p>Mentor profile not found. Please contact support.</p>
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
            <h1>Welcome back, {mentor.name} 👋</h1>
            <p>Manage your mentoring sessions and availability</p>
          </div>
          <div className="date-widget">
            <i className="far fa-calendar-alt"></i>{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </div>
        </div>

        {/* Stats */}
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
          <div className="stat-card-dashboard">
            <div className="stat-title">Avg Rating</div>
            <div className="stat-value">{avgRating ? `⭐ ${avgRating}` : '—'}</div>
            <i className="fas fa-star stat-icon"></i>
          </div>
        </div>

        {/* Charts */}
        <div className="dashboard-main">
          <div className="dashboard-card">
            <h3><i className="fas fa-chart-line"></i> Sessions Over Time</h3>
            {sessionsOverTime.length === 0 ? (
              <p style={{ color: 'var(--muted)', padding: '2rem 0', textAlign: 'center' }}>
                No session data yet.
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
            <h3><i className="fas fa-chart-bar"></i> Rating Distribution</h3>
            {ratings.length === 0 ? (
              <p style={{ color: 'var(--muted)', padding: '2rem 0', textAlign: 'center' }}>
                No feedback received yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ratingCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1a6b6b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Upcoming & Past sessions */}
        <div className="dashboard-main">
          <div className="dashboard-card">
            <h3><i className="fas fa-calendar-alt"></i> Upcoming Sessions</h3>
            {upcoming.length === 0 ? (
              <p>No upcoming sessions scheduled.</p>
            ) : (
              <table className="session-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Date &amp; Time</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map(b => {
                    const student = getStudentById(b.student_id);
                    return (
                      <tr key={b.id}>
                        <td>
                          <strong>{student?.name || b.student_id}</strong>
                        </td>
                        <td>
                          {new Date(b.slot).toLocaleDateString()}<br />
                          {new Date(b.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <button
                            className="btn-outline"
                            style={{ padding: '0.2rem 0.8rem' }}
                            onClick={() => handleCompleteSession(b.id)}
                            disabled={actionLoading}
                          >
                            Mark Completed
                          </button>
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
                    <th>Student</th>
                    <th>Date</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map(b => {
                    const student = getStudentById(b.student_id);
                    const fb      = getFeedbackByBooking(b.id);
                    return (
                      <tr key={b.id}>
                        <td><strong>{student?.name || b.student_id}</strong></td>
                        <td>{new Date(b.slot).toLocaleDateString()}</td>
                        <td>
                          {fb
                            ? <span className="feedback-badge">⭐ {fb.rating}/5 — "{fb.comment}"</span>
                            : <span style={{ color: 'var(--muted)' }}>No feedback yet</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Availability & Profile */}
        <div className="dashboard-main">
          <div className="dashboard-card">
            <h3><i className="fas fa-clock"></i> Manage Availability</h3>
            <div className="availability-form">
              <input
                type="date"
                value={newSlotDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setNewSlotDate(e.target.value)}
              />
              <input
                type="time"
                value={newSlotTime}
                onChange={e => setNewSlotTime(e.target.value)}
              />
              <button className="btn-primary" onClick={handleAddSlot}>
                Add Slot
              </button>
            </div>
            {mentor.availableSlots?.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No available slots. Add one above.</p>
            ) : (
              <ul className="availability-list">
                {mentor.availableSlots?.map((slot, idx) => (
                  <li key={idx}>
                    <span>
                      <i className="far fa-clock"></i>{' '}
                      {new Date(slot).toLocaleString()}
                    </span>
                    <button className="btn-outline" onClick={() => handleRemoveSlot(slot)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dashboard-card">
            <h3><i className="fas fa-user-circle"></i> Your Profile</h3>
            <div className="profile-info">
              <p><strong>Name:</strong> {mentor.name}</p>
              <p><strong>Title:</strong> {mentor.title || '—'}</p>
              <p><strong>Company:</strong> {mentor.company || '—'}</p>
              <p><strong>Expertise:</strong> {mentor.expertise?.join(', ') || '—'}</p>
              <p><strong>Rating:</strong> ⭐ {mentor.rating} ({mentor.reviews} reviews)</p>
            </div>
            <button className="btn-outline" style={{ marginTop: '1rem' }}>
              Edit Profile
            </button>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default MentorDashboard;