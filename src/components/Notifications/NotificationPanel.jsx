// src/components/Notifications/NotificationPanel.jsx
import React from 'react';
import { X, Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationPanel = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    getNotificationColor
  } = useNotifications();

  if (!isOpen) return null;

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins === 1) return 'Il y a 1 minute';
    if (diffMins < 60) return `Il y a ${diffMins} minutes`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Il y a 1 heure';
    if (diffHours < 24) return `Il y a ${diffHours} heures`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return notifTime.toLocaleDateString('fr-FR');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              <CheckCheck size={16} />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Liste des notifications */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Aucune notification
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 text-center mt-1">
                Vous serez notifié des nouvelles activités
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${
                    !notification.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center text-lg`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-medium ${
                          !notification.read 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>

                      {/* Actions */}
                      {notification.actionUrl && (
                        <a
                          href={notification.actionUrl}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
                        >
                          Voir détails →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Voir toutes les notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;