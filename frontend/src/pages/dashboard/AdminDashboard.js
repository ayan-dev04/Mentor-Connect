import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import PageTransition from '../../components/PageTransition';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { students, mentors, bookings, feedback, getMentorById } = useData();

  const totalUsers = (students?.length || 0) + (mentors?.length || 0);
  const totalSessions = bookings?.length || 0;
  const avgRating = feedback?.length
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : 0;

  // Bookings over time (using created_at)
  const bookingsOverTime = (bookings || []).reduce((acc, b) => {
    const date = new Date(b.created_at).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) existing.count++;
    else acc.push({ date, count: 1 });
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Top mentors by number of sessions
  const mentorSessionCount = {};
  (bookings || []).forEach(b => {
    mentorSessionCount[b.mentor_id] = (mentorSessionCount[b.mentor_id] || 0) + 1;
  });
  const topMentors = Object.entries(mentorSessionCount)
    .map(([id, count]) => ({ name: getMentorById(id)?.name || 'Unknown', sessions: count }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 5);

  return (
    <PageTransition>
      <div className="dashboard-container" style={{ paddingTop: '80px' }}>
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.name || 'Admin'} – platform overview</p>
          </div>
          <div className="date-widget">
            <i className="far fa-calendar-alt"></i> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card-dashboard">
            <div className="stat-title">Total Users</div>
            <div className="stat-value">{totalUsers}</div>
            <i className="fas fa-users stat-icon"></i>
          </div>
          <div className="stat-card-dashboard">
            <div className="stat-title">Total Sessions</div>
            <div className="stat-value">{totalSessions}</div>
            <i className="fas fa-chalkboard-user stat-icon"></i>
          </div>
          <div className="stat-card-dashboard">
            <div className="stat-title">Avg Rating</div>
            <div className="stat-value">{avgRating}</div>
            <i className="fas fa-star stat-icon"></i>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-card">
            <h3><i className="fas fa-chart-line"></i> Bookings Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#c9a84c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-card">
            <h3><i className="fas fa-trophy"></i> Top Mentors (by sessions)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topMentors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessions" fill="#1a6b6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-card">
            <h3><i className="fas fa-user-graduate"></i> Students & Mentors</h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div><strong>Students</strong><br />{students?.length || 0}</div>
              <div><strong>Mentors</strong><br />{mentors?.length || 0}</div>
            </div>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--teal)' }}>View all students</summary>
              <ul className="user-list" style={{ marginTop: '0.5rem' }}>
                {(students || []).map(s => <li key={s.id}>{s.name} ({s.email})</li>)}
              </ul>
            </details>
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--teal)' }}>View all mentors</summary>
              <ul className="user-list" style={{ marginTop: '0.5rem' }}>
                {(mentors || []).map(m => <li key={m.id}>{m.name} - {m.company} (⭐ {m.rating})</li>)}
              </ul>
            </details>
          </div>

          <div className="dashboard-card">
            <h3><i className="fas fa-comment"></i> Recent Feedback</h3>
            {!feedback || feedback.length === 0 ? (
              <p>No feedback yet.</p>
            ) : (
              <ul className="feedback-list">
                {feedback.slice(-5).map(f => {
                  const booking = bookings?.find(b => b.id === f.booking_id);
                  const mentor = booking ? getMentorById(booking.mentor_id) : null;
                  return (
                    <li key={f.id} className="feedback-item">
                      <div><strong>⭐ {f.rating}/5</strong> – "{f.comment}"</div>
                      <div className="activity-time">{mentor ? `For ${mentor.name}` : ''}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;