// src/components/Notifications/NotificationPrompt.jsx
import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * Composant pour demander l'activation des notifications
 * Affiche une bannière élégante en bas à droite
 */
const NotificationPrompt = () => {
  const { 
    permission, 
    requestPermission, 
    isInitializing,
    isSupported 
  } = useNotifications();
  
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Vérifier si l'utilisateur a déjà refusé/accepté dans cette session
  useEffect(() => {
    const hasSeenPrompt = sessionStorage.getItem('notificationPromptSeen');
    if (hasSeenPrompt === 'true') {
      setDismissed(true);
    }
  }, []);

  // Ne pas afficher si :
  // - Pas supporté par le navigateur
  // - Permission déjà accordée
  // - Permission refusée
  // - Utilisateur a fermé le prompt
  if (!isSupported || permission === 'granted' || permission === 'denied' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('notificationPromptSeen', 'true');
  };

  const handleEnable = async () => {
    const success = await requestPermission();
    if (success) {
      setDismissed(true);
    }
  };

  return (
    <>
      {/* Bannière principale */}
      <div className="fixed bottom-4 right-4 max-w-md z-50 animate-in slide-in-from-bottom-5 duration-500">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-2xl overflow-hidden">
          {/* Header avec close button */}
          <div className="relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition z-10"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            {/* Contenu */}
            <div className="p-6 pr-12">
              <div className="flex items-start gap-4">
                {/* Icône */}
                <div className="flex-shrink-0">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                    <Bell className="text-white" size={28} />
                  </div>
                </div>

                {/* Texte */}
                <div className="flex-1 text-white">
                  <h3 className="font-bold text-lg mb-1">
                    Restez informé en temps réel
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Recevez des notifications pour les nouvelles interventions, 
                    les messages et les mises à jour importantes.
                  </p>

                  {/* Avantages */}
                  {showDetails && (
                    <ul className="mt-3 space-y-2 text-sm text-white/80">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="flex-shrink-0" />
                        <span>Alertes instantanées pour vos interventions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="flex-shrink-0" />
                        <span>Notifications de nouveaux messages</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="flex-shrink-0" />
                        <span>Mises à jour de statut importantes</span>
                      </li>
                    </ul>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleEnable}
                      disabled={isInitializing}
                      className="flex-1 bg-white text-indigo-600 py-2.5 px-4 rounded-lg 
                               font-semibold hover:bg-gray-50 transition 
                               disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2"
                    >
                      {isInitializing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent" />
                          Activation...
                        </>
                      ) : (
                        <>
                          <Bell size={18} />
                          Activer
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-white/90 hover:text-white text-sm font-medium transition"
                    >
                      {showDetails ? 'Voir moins' : 'En savoir plus'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Barre de progression décorative */}
            <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400" />
          </div>
        </div>

        {/* Badge "Recommandé" */}
        <div className="absolute -top-3 left-6 bg-green-500 text-white text-xs font-bold 
                      px-3 py-1 rounded-full shadow-lg">
          ⭐ Recommandé
        </div>
      </div>
    </>
  );
};

/**
 * Version alternative : Bannière en haut de page
 */
export const NotificationBanner = () => {
  const { 
    permission, 
    requestPermission, 
    isInitializing 
  } = useNotifications();
  
  const [dismissed, setDismissed] = useState(false);

  if (permission !== 'default' || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center flex-1">
            <Bell className="flex-shrink-0 mr-3" size={24} />
            <p className="font-medium text-sm sm:text-base">
              Activez les notifications pour ne rien manquer
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={requestPermission}
              disabled={isInitializing}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg 
                       font-semibold text-sm hover:bg-gray-50 transition
                       disabled:opacity-50"
            >
              {isInitializing ? 'Activation...' : 'Activer'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-white/80 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Version mini : Badge flottant
 */
export const NotificationBadge = () => {
  const { 
    permission, 
    requestPermission, 
    isInitializing 
  } = useNotifications();
  
  const [dismissed, setDismissed] = useState(false);

  if (permission !== 'default' || dismissed) {
    return null;
  }

  return (
    <button
      onClick={requestPermission}
      disabled={isInitializing}
      className="fixed bottom-4 left-4 bg-indigo-600 hover:bg-indigo-700 
               text-white p-4 rounded-full shadow-lg transition 
               disabled:opacity-50 disabled:cursor-not-allowed z-50
               flex items-center gap-2 group"
      title="Activer les notifications"
    >
      <Bell size={24} className={isInitializing ? 'animate-pulse' : 'group-hover:animate-bounce'} />
      <span className="hidden group-hover:inline-block text-sm font-medium whitespace-nowrap">
        Activer les notifications
      </span>
    </button>
  );
};

export default NotificationPrompt;