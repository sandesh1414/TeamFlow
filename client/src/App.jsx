import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TeamPage from './pages/TeamPage';
import AppLayout from './components/AppLayout';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/team/:teamId" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
          <Route path="/team/:teamId/board" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
          <Route path="/team/:teamId/chat" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

