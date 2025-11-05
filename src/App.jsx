// src/App.jsx - VERSION CORRIGÉE
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import AuthScreen from './components/Auth/AuthScreen';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Lazy loading des vues
const DashboardView = lazy(() => import('./components/Dashboard/DashboardView'));
const InterventionsView = lazy(() => import('./components/Interventions/InterventionsView'));
const AnalyticsView = lazy(() => import('./components/Analytics/AnalyticsView'));
const SettingsModal = lazy(() => import('./components/Settings/SettingsModal'));
const AdminPanel = lazy(() => import('./components/Admin/AdminPanel'));

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onOpenAdmin={() => setShowAdmin(true)}
          user={user}
        />
      </div>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar
              currentView={currentView}
              onViewChange={setCurrentView}
              onClose={() => setSidebarOpen(false)}
              onOpenAdmin={() => setShowAdmin(true)}
              isMobile={true}
              user={user}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onOpenAdmin={() => setShowAdmin(true)}
          onOpenSettings={() => setShowSettings(true)}
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<LoadingSpinner />}>
            {currentView === 'dashboard' && <DashboardView user={user} />}
            {currentView === 'interventions' && <InterventionsView user={user} />}
            {currentView === 'analytics' && <AnalyticsView user={user} />}
          </Suspense>
        </main>
      </div>

      {/* Modals */}
      {showAdmin && (
        <Suspense fallback={<LoadingSpinner />}>
          <AdminPanel
            isOpen={showAdmin}
            onClose={() => setShowAdmin(false)}
            user={user}
          />
        </Suspense>
      )}

      {showSettings && (
        <Suspense fallback={<LoadingSpinner />}>
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            user={user}
          />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;