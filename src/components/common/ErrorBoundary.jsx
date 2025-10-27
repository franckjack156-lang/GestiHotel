// src/components/common/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // ✅ Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-2">
              Oups ! Une erreur est survenue
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Nous sommes désolés, quelque chose s'est mal passé.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                  Détails de l'erreur (développement)
                </summary>
                <pre className="text-xs text-red-700 dark:text-red-400 overflow-auto">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Réessayer
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-3 rounded-lg font-medium transition"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;