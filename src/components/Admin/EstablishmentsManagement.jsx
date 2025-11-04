// src/components/Admin/EstablishmentsManagement.jsx - NOUVEAU
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  ToggleLeft,
  ToggleRight,
  Save,
  MapPin,
  Phone,
  Mail,
  Code
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { establishmentService } from '../../services/establishmentService';
import { toast } from '../../utils/toast';

const EstablishmentsManagement = () => {
  const { user } = useAuth();
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEstab, setEditingEstab] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    active: true,
    features: {
      interventions: true,
      rooms: true,
      planning: false,
      analytics: false,
      qrCodes: false,
      templates: false,
      excelImport: false
    }
  });

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    setLoading(true);
    const result = await establishmentService.getAll();
    
    if (result.success) {
      setEstablishments(result.data);
    } else {
      toast.error('Erreur de chargement', {
        description: result.error
      });
    }
    setLoading(false);
  };

  const handleOpenModal = (estab = null) => {
    if (estab) {
      setEditingEstab(estab);
      setFormData({
        name: estab.name,
        code: estab.code,
        address: estab.address || '',
        phone: estab.phone || '',
        email: estab.email || '',
        active: estab.active,
        features: { ...estab.features }
      });
    } else {
      setEditingEstab(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        active: true,
        features: {
          interventions: true,
          rooms: true,
          planning: false,
          analytics: false,
          qrCodes: false,
          templates: false,
          excelImport: false
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEstab(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast.error('Erreur', {
        description: 'Nom et code requis'
      });
      return;
    }

    let result;
    if (editingEstab) {
      result = await establishmentService.update(editingEstab.id, formData, user.uid);
    } else {
      result = await establishmentService.create(formData, user.uid);
    }

    if (result.success) {
      toast.success(editingEstab ? 'Établissement modifié' : 'Établissement créé');
      handleCloseModal();
      loadEstablishments();
    } else {
      toast.error('Erreur', {
        description: result.error
      });
    }
  };

  const handleToggleActive = async (estab) => {
    const result = await establishmentService.toggleActive(estab.id, user.uid);
    
    if (result.success) {
      toast.success(estab.active ? 'Établissement désactivé' : 'Établissement activé');
      loadEstablishments();
    } else {
      toast.error('Erreur', {
        description: result.error
      });
    }
  };

  const handleDelete = async (estab) => {
    if (!window.confirm(`Supprimer l'établissement "${estab.name}" ?\n\nATTENTION: Cette action est irréversible!`)) {
      return;
    }

    const result = await establishmentService.delete(estab.id);
    
    if (result.success) {
      toast.success('Établissement supprimé');
      loadEstablishments();
    } else {
      toast.error('Erreur', {
        description: result.error
      });
    }
  };

  const handleFeatureToggle = (featureKey) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features[featureKey]
      }
    }));
  };

  const features = [
    { key: 'interventions', label: 'Interventions', description: 'Gestion des interventions' },
    { key: 'rooms', label: 'Chambres', description: 'Gestion des chambres' },
    { key: 'planning', label: 'Planning', description: 'Calendrier et planification' },
    { key: 'analytics', label: 'Analytics', description: 'Statistiques et rapports' },
    { key: 'qrCodes', label: 'QR Codes', description: 'Génération de QR codes' },
    { key: 'templates', label: 'Templates', description: 'Modèles de documents' },
    { key: 'excelImport', label: 'Import Excel', description: 'Import de données Excel' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Établissements
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {establishments.length} établissement{establishments.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Nouvel établissement
        </button>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {establishments.map(estab => (
          <div
            key={estab.id}
            className="bg-white dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Building2 className="text-indigo-600 dark:text-indigo-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {estab.name}
                    </h3>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {estab.code}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggleActive(estab)}
                className={`p-2 rounded-lg transition ${
                  estab.active
                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
                title={estab.active ? 'Désactiver' : 'Activer'}
              >
                {estab.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              </button>
            </div>

            {/* Infos */}
            <div className="space-y-2 mb-4 text-sm">
              {estab.address && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={16} />
                  <span>{estab.address}</span>
                </div>
              )}
              {estab.phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone size={16} />
                  <span>{estab.phone}</span>
                </div>
              )}
              {estab.email && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail size={16} />
                  <span>{estab.email}</span>
                </div>
              )}
            </div>

            {/* Fonctionnalités actives */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Fonctionnalités actives
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(estab.features || {}).filter(([_, enabled]) => enabled).map(([key, _]) => (
                  <span
                    key={key}
                    className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full"
                  >
                    {features.find(f => f.key === key)?.label || key}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => handleOpenModal(estab)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
              >
                <Edit size={16} />
                <span className="text-sm font-medium">Modifier</span>
              </button>
              <button
                onClick={() => handleDelete(estab)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {establishments.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucun établissement créé
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingEstab ? 'Modifier l\'établissement' : 'Nouvel établissement'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Informations générales */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Informations générales
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                      placeholder="HOTEL-01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Fonctionnalités */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Fonctionnalités activées
                </h4>
                
                <div className="space-y-3">
                  {features.map(feature => (
                    <label
                      key={feature.key}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {feature.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {feature.description}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFeatureToggle(feature.key)}
                        className={`p-2 rounded-lg transition ${
                          formData.features[feature.key]
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {formData.features[feature.key] ? <Check size={20} /> : <X size={20} />}
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {editingEstab ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstablishmentsManagement;