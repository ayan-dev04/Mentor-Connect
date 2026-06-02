import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import PageTransition from '../../components/PageTransition';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { 
    students, mentors, bookings, feedback, getMentorById, getStudentById,
    adminCreateUser, adminUpdateUser, adminDeleteUser, adminAddAvailability,
    adminRemoveAvailability, adminCreateBooking, adminDeleteBooking,
    cancelBooking, completeSession, adminGetMentorAvailability
  } = useData();

  const [activeTab, setActiveTab] = useState('overview');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '', email: '', password: '', role: 'student', company: '',
    title: '', experience_years: '', profile_pic: '', bio: '', expertise: ''
  });
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ student_id: '', mentor_id: '', slot_id: '' });
  const [availableBookingSlots, setAvailableBookingSlots] = useState([]);
  const [mentorSlots, setMentorSlots] = useState([]);

  const totalUsers = (students?.length || 0) + (mentors?.length || 0);
  const totalSessions = bookings?.length || 0;
  const avgRating = feedback?.length ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 0;

  const bookingsOverTime = (bookings || []).reduce((acc, b) => {
    const date = new Date(b.created_at).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) existing.count++; else acc.push({ date, count: 1 });
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  const mentorSessionCount = {};
  (bookings || []).forEach(b => { mentorSessionCount[b.mentor_id] = (mentorSessionCount[b.mentor_id] || 0) + 1; });
  const topMentors = Object.entries(mentorSessionCount)
    .map(([id, count]) => ({ name: getMentorById(id)?.name || 'Unknown', sessions: count }))
    .sort((a, b) => b.sessions - a.sessions).slice(0, 5);

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', password: '', role: 'student', company: '', title: '', experience_years: '', profile_pic: '', bio: '', expertise: '' });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      name: u.name || '', email: u.email || '', password: '', role: u.role || 'student', company: u.company || '',
      title: u.title || '', experience_years: u.experience_years || '', profile_pic: u.profile_pic || '', bio: u.bio || '',
      expertise: Array.isArray(u.expertise) ? u.expertise.join(', ') : (u.expertise || '')
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...userForm };
      if (payload.experience_years) payload.experience_years = parseInt(payload.experience_years, 10);
      if (editingUser) {
        if (!payload.password) delete payload.password;
        await adminUpdateUser(editingUser.id, payload);
        alert('User updated successfully!');
      } else {
        if (!payload.password) { alert('Password is required for new users.'); return; }
        await adminCreateUser(payload);
        alert('User created successfully!');
      }
      setUserModalOpen(false);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This will cancel bookings.`)) {
      try { await adminDeleteUser(userId); alert('User deleted.'); } catch (err) { alert(`Error: ${err.message}`); }
    }
  };

  const allUsers = [...(students || []).map(s => ({ ...s, role: 'student' })), ...(mentors || []).map(m => ({ ...m, role: 'mentor' }))];
  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const selectedMentor = mentors?.find(m => m.id === selectedMentorId);

  const loadSlots = async (mentorId) => {
    if (!mentorId) { setMentorSlots([]); return; }
    try { const data = await adminGetMentorAvailability(mentorId); setMentorSlots(data); } catch (err) { console.error(err); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSlots(selectedMentorId); }, [selectedMentorId]);

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!selectedMentorId || !newSlot) { alert('Select mentor and slot.'); return; }
    try {
      await adminAddAvailability(selectedMentorId, newSlot);
      setNewSlot('');
      await loadSlots(selectedMentorId);
      alert('Slot added.');
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleRemoveAvailability = async (slotId) => {
    if (window.confirm('Remove slot? Bookings will be cancelled.')) {
      try {
        await adminRemoveAvailability(slotId);
        await loadSlots(selectedMentorId);
        alert('Slot removed.');
      } catch (err) { alert(`Error: ${err.message}`); }
    }
  };

  const handleOpenAddBooking = () => {
    setBookingForm({ student_id: '', mentor_id: '', slot_id: '' });
    setBookingModalOpen(true);
  };

  const handleMentorChangeInBooking = async (mentorId) => {
    setBookingForm(prev => ({ ...prev, mentor_id: mentorId, slot_id: '' }));
    if (!mentorId) { setAvailableBookingSlots([]); return; }
    try {
      const data = await adminGetMentorAvailability(mentorId);
      setAvailableBookingSlots(data.filter(s => !s.is_booked));
    } catch (err) { console.error(err); }
  };

  const handleSaveBooking = async (e) => {
    e.preventDefault();
    const { student_id, mentor_id, slot_id } = bookingForm;
    if (!student_id || !mentor_id || !slot_id) { alert('All fields required.'); return; }
    try {
      await adminCreateBooking(student_id, mentor_id, slot_id);
      setBookingModalOpen(false);
      alert('Session booked!');
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Cancel booking?')) {
      try { await cancelBooking(bookingId); alert('Cancelled.'); } catch (err) { alert(`Error: ${err.message}`); }
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (window.confirm('Complete booking?')) {
      try { await completeSession(bookingId); alert('Completed.'); } catch (err) { alert(`Error: ${err.message}`); }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Delete booking record?')) {
      try { await adminDeleteBooking(bookingId); alert('Deleted.'); } catch (err) { alert(`Error: ${err.message}`); }
    }
  };

  const filteredBookings = (bookings || []).filter(b => {
    const student = getStudentById(b.student_id);
    const mentor = getMentorById(b.mentor_id);
    const term = bookingSearchQuery.toLowerCase();
    return student?.name?.toLowerCase().includes(term) || mentor?.name?.toLowerCase().includes(term) || b.status?.toLowerCase().includes(term);
  });

  const tabContainerStyle = { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.25rem', overflowX: 'auto' };
  const tabItemStyle = (tabId) => ({
    padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', borderRadius: '6px 6px 0 0',
    color: activeTab === tabId ? 'var(--teal)' : '#64748b', borderBottom: activeTab === tabId ? '3px solid var(--teal)' : '3px solid transparent',
    background: activeTab === tabId ? '#f8fafc' : 'transparent', transition: 'all 0.2s ease'
  });

  return (
    <PageTransition>
      <div className="dashboard-container" style={{ paddingTop: '80px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="dashboard-header">
          <div>
            <h1>Admin Management Center</h1>
            <p>Welcome back, {user?.name || 'Administrator'} – oversee system activities</p>
          </div>
          <div className="date-widget"><i className="far fa-calendar-alt"></i> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div style={tabContainerStyle}>
          <div style={tabItemStyle('overview')} onClick={() => setActiveTab('overview')}><i className="fas fa-chart-pie" style={{ marginRight: '8px' }}></i> Overview</div>
          <div style={tabItemStyle('users')} onClick={() => setActiveTab('users')}><i className="fas fa-users-cog" style={{ marginRight: '8px' }}></i> User Accounts</div>
          <div style={tabItemStyle('availability')} onClick={() => setActiveTab('availability')}><i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i> Mentor Availability</div>
          <div style={tabItemStyle('bookings')} onClick={() => setActiveTab('bookings')}><i className="fas fa-calendar-check" style={{ marginRight: '8px' }}></i> Session Schedules</div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="stats-row">
              <div className="stat-card-dashboard"><div className="stat-title">Total Users</div><div className="stat-value">{totalUsers}</div><i className="fas fa-users stat-icon"></i></div>
              <div className="stat-card-dashboard"><div className="stat-title">Total Sessions</div><div className="stat-value">{totalSessions}</div><i className="fas fa-chalkboard-user stat-icon"></i></div>
              <div className="stat-card-dashboard"><div className="stat-title">Avg Rating</div><div className="stat-value">{avgRating}</div><i className="fas fa-star stat-icon"></i></div>
            </div>
            <div className="dashboard-main">
              <div className="dashboard-card">
                <h3><i className="fas fa-chart-line"></i> Bookings Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bookingsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />
                    <Line type="monotone" dataKey="count" stroke="#c9a84c" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="dashboard-card">
                <h3><i className="fas fa-trophy"></i> Top Mentors (by sessions)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topMentors}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="sessions" fill="#1a6b6b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="dashboard-main">
              <div className="dashboard-card" style={{ flex: '1.5' }}>
                <h3><i className="fas fa-comment"></i> Recent Feedback</h3>
                {!feedback || feedback.length === 0 ? <p>No feedback yet.</p> : (
                  <ul className="feedback-list">
                    {feedback.slice(-5).reverse().map(f => {
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
          </>
        )}

        {activeTab === 'users' && (
          <div className="dashboard-card" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <h3><i className="fas fa-users"></i> Manage User Accounts</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="text" placeholder="Search users..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '260px', outline: 'none' }} />
                <button onClick={handleOpenAddUser} className="btn-primary" style={{ padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}><i className="fas fa-user-plus"></i> Add User</button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="session-table" style={{ width: '100%', minWidth: '800px' }}>
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Info / Affiliation</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                <tbody>
                  {filteredUsers.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No users matched your query.</td></tr> : (
                    filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img src={u.profile_pic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name) + '&background=random'} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                            <strong>{u.name}</strong>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: u.role === 'mentor' ? '#e0f2fe' : '#f0fdf4', color: u.role === 'mentor' ? '#0369a1' : '#15803d' }}>
                            {u.role ? u.role.toUpperCase() : 'STUDENT'}
                          </span>
                        </td>
                        <td>{u.role === 'mentor' ? <span>{u.title || 'Mentor'} {u.company ? `at ${u.company}` : ''}</span> : <span style={{ color: '#94a3b8' }}>Student profile</span>}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => handleOpenEditUser(u)} className="btn-outline" style={{ padding: '0.3rem 0.7rem', marginRight: '0.5rem', fontSize: '0.85rem' }}><i className="fas fa-edit"></i> Edit</button>
                          <button onClick={() => handleDeleteUser(u.id, u.name)} className="btn-primary" style={{ padding: '0.3rem 0.7rem', backgroundColor: '#ef4444', borderColor: '#ef4444', fontSize: '0.85rem' }}><i className="fas fa-trash"></i> Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="dashboard-main">
            <div className="dashboard-card" style={{ flex: '1' }}>
              <h3><i className="fas fa-user-tie"></i> Select Mentor</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>Choose a mentor to manage slots:</p>
              <select value={selectedMentorId} onChange={(e) => setSelectedMentorId(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', marginBottom: '1.5rem' }}>
                <option value="">-- Choose Mentor --</option>
                {(mentors || []).map(m => <option key={m.id} value={m.id}>{m.name} ({m.company || 'No Company'})</option>)}
              </select>
              {selectedMentor && (
                <div style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{selectedMentor.name}</h4>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}><strong>Title:</strong> {selectedMentor.title || 'N/A'}</p>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}><strong>Company:</strong> {selectedMentor.company || 'N/A'}</p>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}><strong>Expertise:</strong> {selectedMentor.expertise?.join(', ') || 'None'}</p>
                  <p style={{ margin: '0', fontSize: '0.9rem' }}><strong>Avg Rating:</strong> ⭐ {selectedMentor.rating} ({selectedMentor.reviews} reviews)</p>
                </div>
              )}
            </div>

            <div className="dashboard-card" style={{ flex: '2' }}>
              <h3><i className="fas fa-clock"></i> Manage Availability Slots</h3>
              {!selectedMentorId ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}><i className="fas fa-hand-pointer fa-2x" style={{ marginBottom: '1rem' }}></i><p>Select a mentor to manage slots.</p></div>
              ) : (
                <>
                  <form onSubmit={handleAddAvailability} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#64748b' }}>Date & Time Slot:</label>
                      <input type="datetime-local" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '0.7rem 1.5rem', alignSelf: 'flex-end' }}><i className="fas fa-calendar-plus"></i> Add Availability Slot</button>
                  </form>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="session-table" style={{ width: '100%' }}>
                      <thead><tr><th>Slot Time</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
                      <tbody>
                        {mentorSlots.length === 0 ? <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No slots found.</td></tr> : (
                          mentorSlots.map(slot => (
                            <tr key={slot.id}>
                              <td>{new Date(slot.slot).toLocaleString()}</td>
                              <td><span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: slot.is_booked ? '#fee2e2' : '#f0fdf4', color: slot.is_booked ? '#ef4444' : '#16a34a' }}>{slot.is_booked ? 'Booked' : 'Available'}</span></td>
                              <td style={{ textAlign: 'right' }}><button onClick={() => handleRemoveAvailability(slot.id)} className="btn-primary" style={{ padding: '0.25rem 0.6rem', backgroundColor: '#ef4444', borderColor: '#ef4444', fontSize: '0.8rem' }}><i className="fas fa-times"></i> Delete</button></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="dashboard-card" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <h3><i className="fas fa-calendar-check"></i> Monitor & Schedule Bookings</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="text" placeholder="Filter by student, mentor..." value={bookingSearchQuery} onChange={(e) => setBookingSearchQuery(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '240px', outline: 'none' }} />
                <button onClick={handleOpenAddBooking} className="btn-primary" style={{ padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}><i className="fas fa-plus"></i> Book On Behalf</button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="session-table" style={{ width: '100%', minWidth: '850px' }}>
                <thead><tr><th>Booking ID</th><th>Student Name</th><th>Mentor Name</th><th>Session Date/Time</th><th>Status</th><th style={{ textAlign: 'right' }}>Admin Actions</th></tr></thead>
                <tbody>
                  {filteredBookings.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No booking records found.</td></tr> : (
                    filteredBookings.map(b => {
                      const student = getStudentById(b.student_id);
                      const mentor = getMentorById(b.mentor_id);
                      return (
                        <tr key={b.id}>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>#{b.id.slice(-6)}</td>
                          <td><strong>{student ? student.name : 'Unknown Student'}</strong><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{student?.email || ''}</div></td>
                          <td><strong>{mentor ? mentor.name : 'Unknown Mentor'}</strong><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{mentor?.company || ''}</div></td>
                          <td>{new Date(b.slot).toLocaleString()}</td>
                          <td><span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: b.status === 'completed' ? '#dcfce7' : b.status === 'cancelled' ? '#fee2e2' : '#fef9c3', color: b.status === 'completed' ? '#15803d' : b.status === 'cancelled' ? '#b91c1c' : '#854d0e' }}>{b.status.toUpperCase()}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            {b.status === 'upcoming' && (
                              <>
                                <button onClick={() => handleCompleteBooking(b.id)} className="btn-outline" style={{ padding: '0.25rem 0.6rem', marginRight: '0.4rem', fontSize: '0.8rem', color: '#16a34a', borderColor: '#16a34a' }}><i className="fas fa-check"></i> Complete</button>
                                <button onClick={() => handleCancelBooking(b.id)} className="btn-outline" style={{ padding: '0.25rem 0.6rem', marginRight: '0.4rem', fontSize: '0.8rem', color: '#b91c1c', borderColor: '#b91c1c' }}><i className="fas fa-ban"></i> Cancel</button>
                              </>
                            )}
                            <button onClick={() => handleDeleteBooking(b.id)} className="btn-primary" style={{ padding: '0.25rem 0.6rem', backgroundColor: '#ef4444', borderColor: '#ef4444', fontSize: '0.8rem' }}><i className="fas fa-trash-alt"></i> Delete Record</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {userModalOpen && (
          <div className="modal-overlay" onClick={() => setUserModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--teal)' }}>{editingUser ? `Edit Account: ${editingUser.name}` : 'Add New User Account'}</h2>
              <form onSubmit={handleSaveUser}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Full Name:</label><input type="text" required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Email Address:</label><input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Password {editingUser && '(leave blank to keep)'}:</label><input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>User Role:</label><select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}><option value="student">Student</option><option value="mentor">Mentor</option></select></div>
                </div>

                {userForm.role === 'mentor' && (
                  <div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--teal)' }}>Mentor Specific Fields</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Company:</label><input type="text" value={userForm.company} onChange={(e) => setUserForm({ ...userForm, company: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                      <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Job Title:</label><input type="text" value={userForm.title} onChange={(e) => setUserForm({ ...userForm, title: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Experience (Years):</label><input type="number" value={userForm.experience_years} onChange={(e) => setUserForm({ ...userForm, experience_years: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                      <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Expertise (comma separated):</label><input type="text" placeholder="e.g. React, Python" value={userForm.expertise} onChange={(e) => setUserForm({ ...userForm, expertise: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Profile Picture URL:</label><input type="text" placeholder="https://..." value={userForm.profile_pic} onChange={(e) => setUserForm({ ...userForm, profile_pic: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                <div style={{ marginBottom: '1.5rem' }}><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Short Biography:</label><textarea rows="3" value={userForm.bio} onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical' }} /></div>
                <div className="modal-actions"><button type="button" onClick={() => setUserModalOpen(false)} className="btn-outline">Cancel</button><button type="submit" className="btn-primary">Save Account</button></div>
              </form>
            </div>
          </div>
        )}

        {bookingModalOpen && (
          <div className="modal-overlay" onClick={() => setBookingModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--teal)' }}>Book Mentoring Session</h2>
              <form onSubmit={handleSaveBooking}>
                <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Select Student:</label><select required value={bookingForm.student_id} onChange={(e) => setBookingForm({ ...bookingForm, student_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}><option value="">-- Choose Student --</option>{(students || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}</select></div>
                <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Select Mentor:</label><select required value={bookingForm.mentor_id} onChange={(e) => handleMentorChangeInBooking(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}><option value="">-- Choose Mentor --</option>{(mentors || []).map(m => <option key={m.id} value={m.id}>{m.name} ({m.company || 'No Company'})</option>)}</select></div>
                {bookingForm.mentor_id && (
                  <div style={{ marginBottom: '1.5rem' }}><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Select Availability Slot:</label><select required value={bookingForm.slot_id} onChange={(e) => setBookingForm({ ...bookingForm, slot_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}><option value="">-- Choose Slot --</option>{availableBookingSlots.map(s => <option key={s.id} value={s.id}>{new Date(s.slot).toLocaleString()}</option>)}</select></div>
                )}
                <div className="modal-actions"><button type="button" onClick={() => setBookingModalOpen(false)} className="btn-outline">Cancel</button><button type="submit" className="btn-primary" disabled={!bookingForm.slot_id}>Book Session</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;