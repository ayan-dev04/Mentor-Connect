import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://mentor-connect-backend-7djl.onrender.com/api';

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [students, setStudents]   = useState([]);
  const [mentors, setMentors]     = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [feedback, setFeedback]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [dataReady, setDataReady] = useState(false);  // new: indicates all initial data loaded

  // Fast lookup map for mentors
  const [mentorsMap, setMentorsMap] = useState({});

  // Update map whenever mentors array changes
  useEffect(() => {
    const map = {};
    mentors.forEach(m => {
      // store under both string and number versions of id to avoid type mismatches
      const idStr = String(m.id);
      map[idStr] = m;
      if (typeof m.id === 'number') map[m.id] = m;
    });
    setMentorsMap(map);
  }, [mentors]);

  // ── Auth fetch helper ──────────────────────────────────────────────
  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      let msg = `HTTP ${response.status}`;
      try { const e = await response.json(); msg = e.error || msg; } catch (_) {}
      throw new Error(msg);
    }
    return response.json();
  }, []);

  // ── Fetchers ───────────────────────────────────────────────────────
  const fetchMentors = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/mentors');
      setMentors(data);
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
    }
  }, [fetchWithAuth]);

  const fetchStudents = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'mentor')) return;
    try {
      const endpoint = '/admin/students';
      const data = await fetchWithAuth(endpoint);
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  }, [user, fetchWithAuth]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      let endpoint = '';
      if (user.role === 'student')     endpoint = '/bookings/student';
      else if (user.role === 'mentor') endpoint = '/bookings/mentor';
      else if (user.role === 'admin')  endpoint = '/admin/bookings';
      else return;
      const data = await fetchWithAuth(endpoint);
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  }, [user, fetchWithAuth]);

  const fetchFeedback = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const data = await fetchWithAuth('/admin/feedback');
      setFeedback(data);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    }
  }, [user, fetchWithAuth]);

  // ── Initial load ───────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setDataReady(false);
      await fetchMentors();
      if (user) {
        await fetchBookings();
        if (user.role === 'mentor') await fetchStudents();
        if (user.role === 'admin') {
          await fetchStudents();
          await fetchFeedback();
        }
      }
      setLoading(false);
      setDataReady(true);
    };
    loadData();
  }, [user, fetchMentors, fetchBookings, fetchStudents, fetchFeedback]);

  // ── Refresh helpers ────────────────────────────────────────────────
  const refreshBookings = useCallback(async () => {
    if (!user) return;
    try {
      let endpoint = '';
      if (user.role === 'student')     endpoint = '/bookings/student';
      else if (user.role === 'mentor') endpoint = '/bookings/mentor';
      else if (user.role === 'admin')  endpoint = '/admin/bookings';
      else return;
      const data = await fetchWithAuth(endpoint);
      setBookings(data);
    } catch (err) {
      console.error('Failed to refresh bookings:', err);
    }
  }, [user, fetchWithAuth]);

  const refreshMentors = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/mentors');
      setMentors(data);
    } catch (err) {
      console.error('Failed to refresh mentors:', err);
    }
  }, [fetchWithAuth]);

  const refreshStudents = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'mentor')) return;
    try {
      const data = await fetchWithAuth('/admin/students');
      setStudents(data);
    } catch (err) {
      console.error('Failed to refresh students:', err);
    }
  }, [user, fetchWithAuth]);

  // ── Real-time Polling Effect (Updates dashboards in real-time every 5 seconds) ──
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshBookings();
      refreshMentors();
      if (user.role === 'mentor' || user.role === 'admin') {
        refreshStudents();
      }
      if (user.role === 'admin') {
        fetchFeedback();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, refreshBookings, refreshMentors, refreshStudents, fetchFeedback]);

  // ── Lookup helpers – improved with map and fallback ────────────────
  // Returns mentor object or a safe fallback (prevents "Loading…" forever)
  const getMentorById = useCallback((id) => {
    if (!id) return { name: 'Unknown Mentor', title: '', id: null };
    const key = String(id);
    const mentor = mentorsMap[key];
    if (mentor) return mentor;
    // Fallback when data is ready but mentor not found (e.g., deleted mentor)
    if (!loading && dataReady) {
      return { name: 'Mentor Unavailable', title: '', id };
    }
    // Still loading – return a neutral placeholder (avoid "Loading…" text)
    return { name: 'Loading mentor...', title: '' };
  }, [mentorsMap, loading, dataReady]);

  const getStudentById = useCallback((id) => {
    if (!id) return null;
    return students.find(s => s.id === id || s.id === String(id)) || null;
  }, [students]);

  // Student's own bookings — the API /bookings/student returns bookings for logged-in student.
  const getBookingsByStudent = useCallback(() => {
    return bookings;
  }, [bookings]);

  // Mentor's own bookings — same logic.
  const getBookingsByMentor = useCallback(() => {
    return bookings;
  }, [bookings]);

  const getFeedbackByBooking = useCallback((bookingId) => {
    if (!bookingId) return null;
    return feedback.find(f => f.booking_id === bookingId || f.booking_id === String(bookingId)) || null;
  }, [feedback]);

  const getAverageRatingForMentor = useCallback((mentorId) => {
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const relevantFeedback = completedBookings
      .map(b => getFeedbackByBooking(b.id))
      .filter(Boolean);
    if (relevantFeedback.length === 0) return null;
    const sum = relevantFeedback.reduce((acc, f) => acc + f.rating, 0);
    return (sum / relevantFeedback.length).toFixed(1);
  }, [bookings, getFeedbackByBooking]);

  // ── Actions ────────────────────────────────────────────────────────
  const addBooking = async (mentorId, slotId) => {
    await fetchWithAuth('/bookings', {
      method: 'POST',
      body: JSON.stringify({ mentor_id: mentorId, slot_id: slotId }),
    });
    await refreshBookings();
    await refreshMentors();
  };

  const cancelBooking = async (bookingId) => {
    await fetchWithAuth(`/bookings/${bookingId}/cancel`, { method: 'PUT' });
    await refreshBookings();
    await refreshMentors();
  };

  const completeSession = async (bookingId) => {
    await fetchWithAuth(`/bookings/${bookingId}/complete`, { method: 'PUT' });
    await refreshBookings();
  };

  const addFeedback = async (bookingId, rating, comment) => {
    await fetchWithAuth('/feedback', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, rating, comment }),
    });
    await refreshBookings();
    if (user?.role === 'admin') await fetchFeedback();
  };

  const addAvailabilitySlot = async (slot) => {
    await fetchWithAuth('/availability', {
      method: 'POST',
      body: JSON.stringify({ slot }),
    });
    await refreshMentors();
  };

  const removeAvailabilitySlot = async (slot) => {
    await fetchWithAuth(`/availability/${encodeURIComponent(slot)}`, { method: 'DELETE' });
    await refreshMentors();
  };

  const adminCreateUser = async (userData) => {
    await fetchWithAuth('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    await refreshStudents();
    await refreshMentors();
  };

  const adminUpdateUser = async (userId, userData) => {
    await fetchWithAuth(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    await refreshStudents();
    await refreshMentors();
  };

  const adminDeleteUser = async (userId) => {
    await fetchWithAuth(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
    await refreshStudents();
    await refreshMentors();
    await refreshBookings();
  };

  const adminAddAvailability = async (mentorId, slot) => {
    await fetchWithAuth('/admin/availability', {
      method: 'POST',
      body: JSON.stringify({ mentor_id: mentorId, slot }),
    });
    await refreshMentors();
  };

  const adminRemoveAvailability = async (slotId) => {
    await fetchWithAuth(`/admin/availability/${slotId}`, {
      method: 'DELETE',
    });
    await refreshMentors();
    await refreshBookings();
  };

  const adminCreateBooking = async (studentId, mentorId, slotId) => {
    await fetchWithAuth('/admin/bookings', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, mentor_id: mentorId, slot_id: slotId }),
    });
    await refreshBookings();
    await refreshMentors();
  };

  const adminDeleteBooking = async (bookingId) => {
    await fetchWithAuth(`/admin/bookings/${bookingId}`, {
      method: 'DELETE',
    });
    await refreshBookings();
    await refreshMentors();
  };

  const adminGetMentorAvailability = async (mentorId) => {
    return fetchWithAuth(`/admin/mentors/${mentorId}/availability`);
  };

  // ── Context value ──────────────────────────────────────────────────
  const value = {
    students,
    mentors,
    bookings,
    feedback,
    loading,
    dataReady,        // new: true when all initial data has been loaded
    getMentorById,
    getStudentById,
    getBookingsByStudent,
    getBookingsByMentor,
    getFeedbackByBooking,
    getAverageRatingForMentor,
    addBooking,
    cancelBooking,
    completeSession,
    addFeedback,
    addAvailabilitySlot,
    removeAvailabilitySlot,
    refreshBookings,
    refreshMentors,
    refreshStudents,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
    adminAddAvailability,
    adminRemoveAvailability,
    adminCreateBooking,
    adminDeleteBooking,
    adminGetMentorAvailability,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};