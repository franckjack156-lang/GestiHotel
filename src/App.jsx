// src/App.jsx - VERSION CORRIGÉE
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useInterventions } from './hooks/useInterventions';
import LoadingSpinner from './components/common/LoadingSpinner';
import AuthScreen from './components/Auth/AuthScreen';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Lazy loading des vues
const DashboardView = lazy(() => import('./components/Dashboard/DashboardView'));
const InterventionsView = lazy(() => import('./components/Interventions/InterventionsView'));
const RoomsManagementView = lazy(() => import('./components/Rooms/RoomsManagementView'));
const CalendarView = lazy(() => import('./components/Planning/CalendarView'));
const AnalyticsView = lazy(() => import('./components/Analytics/AnalyticsView'));
const QRCodeManager = lazy(() => import('./components/QRCode/QRCodeManager'));
const TemplateManager = lazy(() => import('./components/Templates/TemplateManager'));
const SettingsModal = lazy(() => import('./components/Settings/SettingsModal'));
const AdminPanel = lazy(() => import('./components/Admin/AdminPanel'));

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Charger les interventions pour Analytics
  const { interventions } = useInterventions(user, { autoRefresh: true });

  // Paramètres utilisateur (localStorage)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('gestihotel_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      notifications: {
        enabled: true,
        sound: true,
        desktop: true
      },
      language: 'fr',
      autoSave: true
    };
  });

  // Sauvegarder les paramètres dans localStorage
  useEffect(() => {
    localStorage.setItem('gestihotel_settings', JSON.stringify(settings));
  }, [settings]);

  // Calculer les stats pour Analytics
  const stats = {
    totalInterventions: interventions.length,
    completedThisMonth: interventions.filter(i => i.status === 'done').length,
    activeUsers: 1,
    averageResponseTime: '2.5h'
  };

  // Handlers pour Settings
  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      theme: 'light',
      notifications: {
        enabled: true,
        sound: true,
        desktop: true
      },
      language: 'fr',
      autoSave: true
    };
    setSettings(defaultSettings);
    return defaultSettings;
  };

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
          onOpenQRCode={() => setShowQRCode(true)}
          onOpenTemplates={() => setShowTemplates(true)}
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
              onOpenQRCode={() => setShowQRCode(true)}
              onOpenTemplates={() => setShowTemplates(true)}
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
            {currentView === 'rooms' && <RoomsManagementView user={user} />}
            {currentView === 'planning' && <CalendarView user={user} />}
            {currentView === 'analytics' && (
              <AnalyticsView
                user={user}
                stats={stats}
                interventions={interventions}
              />
            )}
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
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSettings={handleResetSettings}
          />
        </Suspense>
      )}

      {showQRCode && (
        <Suspense fallback={<LoadingSpinner />}>
          <QRCodeManager
            isOpen={showQRCode}
            onClose={() => setShowQRCode(false)}
            user={user}
          />
        </Suspense>
      )}

      {showTemplates && (
        <Suspense fallback={<LoadingSpinner />}>
          <TemplateManager
            isOpen={showTemplates}
            onClose={() => setShowTemplates(false)}
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