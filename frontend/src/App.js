import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Toast from './components/Toast';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Mentors from './pages/Mentors';
import About from './pages/About';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import MentorDashboard from './pages/dashboard/MentorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import MentorProfile from './pages/MentorProfile';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { loginMessage, clearMessage } = useAuth();

  return (
    <>
      {loginMessage && <Toast message={loginMessage} onClose={clearMessage} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/mentors" element={<Mentors />} />
        <Route path="/about" element={<About />} />
        <Route path="/mentor/:id" element={<MentorProfile />} />

        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/mentor"
          element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;