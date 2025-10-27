import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ toast, onRemove }) => {
  const { id, type, title, message, duration = 5000 } = toast;

  useEffect(() => {
    if (duration === 0) return;

    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <XCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-amber-500" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-amber-800 dark:text-amber-200';
      case 'info':
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border shadow-lg transition-all duration-300 ${getBackgroundColor()} animate-in slide-in-from-right-full`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold mb-1 ${getTextColor()}`}>
              {title}
            </h4>
          )}
          {message && (
            <p className={`text-sm ${getTextColor()} opacity-90`}>
              {message}
            </p>
          )}
        </div>
        
        <button
          onClick={() => onRemove(id)}
          className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        >
          <X size={16} className={getTextColor()} />
        </button>
      </div>
    </div>
  );
};

export default Toast;