import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const NetworkStatus = ({ isOnline, isSyncing, lastSync, syncError }) => {
  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600 dark:text-red-400';
    if (isSyncing) return 'text-blue-600 dark:text-blue-400';
    if (syncError) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={16} />;
    if (isSyncing) return <RefreshCw size={16} className="animate-spin" />;
    if (syncError) return <CloudOff size={16} />;
    return <Wifi size={16} />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Hors ligne';
    if (isSyncing) return 'Synchronisation...';
    if (syncError) return 'Erreur de sync';
    return 'En ligne';
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Jamais';
    
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - syncTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes === 1) return 'Il y a 1 minute';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} minutes`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return 'Il y a 1 heure';
    if (diffHours < 24) return `Il y a ${diffHours} heures`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Il y a 1 jour';
    return `Il y a ${diffDays} jours`;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
      </div>
      
      {isOnline && lastSync && (
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <CheckCircle size={14} />
          <span>Sync: {formatLastSync(lastSync)}</span>
        </div>
      )}
      
      {syncError && (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <XCircle size={14} />
          <span className="hidden sm:inline">Erreur de connexion</span>
        </div>
      )}
    </div>
  );
};

export default NetworkStatus;