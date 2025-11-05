// src/components/layout/EstablishmentSwitcher.jsx
import React, { useState, useEffect } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const EstablishmentSwitcher = () => {
  const { user, currentEstablishment, changeEstablishment } = useAuth();
  const [establishments, setEstablishments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Charger les établissements (SuperAdmin uniquement)
  useEffect(() => {
    if (user?.role !== 'superadmin') return;

    const loadEstablishments = async () => {
      try {
        const q = query(collection(db, 'establishments'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setEstablishments(data);
      } catch (error) {
        console.error('Erreur chargement établissements:', error);
      }
    };

    loadEstablishments();
  }, [user]);

  // Ne pas afficher si pas SuperAdmin
  if (user?.role !== 'superadmin' || establishments.length === 0) {
    return null;
  }

  const handleSelect = async (establishmentId) => {
    setLoading(true);
    const result = await changeEstablishment(establishmentId);
    
    if (result.success) {
      setIsOpen(false);
      window.location.reload(); // Recharger pour appliquer les changements
    }
    
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        disabled={loading}
      >
        <Building2 size={18} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {currentEstablishment?.name || 'Tous les établissements'}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              {/* Option "Tous les établissements" */}
              <button
                onClick={() => handleSelect(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                  !currentEstablishment
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-sm font-medium">Tous les établissements</span>
                {!currentEstablishment && <Check size={16} />}
              </button>

              {/* Liste des établissements */}
              {establishments.map(estab => (
                <button
                  key={estab.id}
                  onClick={() => handleSelect(estab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                    currentEstablishment?.id === estab.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  disabled={!estab.active}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{estab.name}</span>
                    {!estab.active && (
                      <span className="text-xs text-gray-500">(Inactif)</span>
                    )}
                  </div>
                  {currentEstablishment?.id === estab.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EstablishmentSwitcher;