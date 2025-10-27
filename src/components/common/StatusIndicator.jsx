import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const StatusIndicator = ({ isOnline, pendingActions = [] }) => {
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium transition-all ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-orange-500 text-white'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
        {!isOnline && pendingActions.length > 0 && (
          <span className="bg-white text-orange-500 px-2 py-1 rounded text-xs">
            {pendingActions.length} action(s) en attente
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;