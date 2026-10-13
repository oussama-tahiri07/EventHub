import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RegisterModal } from './components/RegisterModal';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { EventsList } from './pages/EventsList';
import { EventDetail } from './pages/EventDetail';
import { ParticipantsList } from './pages/ParticipantsList';

const MainLayout = ({ children, onOpenRegisterModal }) => {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenRegisterModal={onOpenRegisterModal} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export function App() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout onOpenRegisterModal={() => setIsRegisterModalOpen(true)}>
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <Dashboard
                            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                          />
                        }
                      />
                      <Route path="/events" element={<EventsList />} />
                      <Route path="/events/:id" element={<EventDetail />} />
                      <Route path="/participants" element={<ParticipantsList />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </MainLayout>
                  <RegisterModal
                    isOpen={isRegisterModalOpen}
                    onClose={() => setIsRegisterModalOpen(false)}
                    onSuccess={() => {}}
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
