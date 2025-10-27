// src/components/Admin/InitializeDatabaseButton.jsx
import React, { useState } from 'react';
import { Database, Loader } from 'lucide-react';
import { initializeFirestoreData } from '../../utils/initFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const InitializeDatabaseButton = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  const handleInitialize = async () => {
    if (!window.confirm('⚠️ Voulez-vous initialiser la base de données avec des données de test ?\n\nCela ajoutera :\n- Types de locaux, missions, priorités\n- Techniciens de test\n- Fournisseurs de test\n- Équipements de test\n- 3 interventions d\'exemple')) {
      return;
    }

    setLoading(true);

    try {
      const result = await initializeFirestoreData(user.uid, user.name);
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Base de données initialisée !',
          message: `${result.count} éléments créés. Rechargez la page.`,
          duration: 10000
        });

        // Recharger la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: result.error
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de l\'initialisation'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Database size={24} />
            Base de données vide
          </h3>
          <p className="text-indigo-100 text-sm mb-4">
            Aucune donnée détectée. Initialisez la base avec des données de test pour commencer.
          </p>
          <ul className="text-sm text-indigo-100 space-y-1 mb-4">
            <li>✅ Types de locaux et missions</li>
            <li>✅ Techniciens, fournisseurs et équipements</li>
            <li>✅ 3 interventions d'exemple</li>
          </ul>
          <button
            onClick={handleInitialize}
            disabled={loading}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Initialisation en cours...
              </>
            ) : (
              <>
                <Database size={20} />
                Initialiser la base de données
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitializeDatabaseButton;