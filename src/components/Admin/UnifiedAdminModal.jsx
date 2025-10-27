import React, { useState, useMemo } from 'react';
import { 
  X, Search, Plus, Edit3, Trash2, Eye, EyeOff, 
  Home, MapPin, ClipboardList, User, Hammer, AlertCircle,
  Users, Package, Settings, Filter, Download, Upload,
  Save, Info, CheckCircle, XCircle
} from 'lucide-react';

/**
 * Modal de gestion unifiée pour TOUTES les données de référence
 * - Listes déroulantes (types, priorités, localisations...)
 * - Données admin (techniciens, fournisseurs, équipements)
 */
const UnifiedAdminModal = ({ 
  isOpen, 
  onClose, 
  data,
  loading,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleActive
}) => {
  const [activeCategory, setActiveCategory] = useState('locations');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  

  // Configuration des catégories avec métadonnées
  const categories = {
    // 🏠 LISTES DÉROULANTES
    locations: { 
      label: 'Localisations', 
      icon: MapPin, 
      type: 'dropdown',
      section: 'dropdowns',
      fields: ['name', 'description'],
      description: 'Chambres, suites, espaces communs'
    },
    roomTypes: { 
      label: 'Types de locaux', 
      icon: Home, 
      type: 'dropdown',
      section: 'dropdowns',
      fields: ['name', 'description']
    },
    missionTypes: { 
      label: 'Types de mission', 
      icon: ClipboardList, 
      type: 'dropdown',
      section: 'dropdowns',
      fields: ['name', 'description']
    },
    interventionTypes: { 
      label: 'Types d\'intervention', 
      icon: Hammer, 
      type: 'dropdown',
      section: 'dropdowns',
      fields: ['name', 'description']
    },
    priorities: { 
      label: 'Priorités', 
      icon: AlertCircle, 
      type: 'dropdown',
      section: 'dropdowns',
      fields: ['name', 'description', 'color']
    },
    departments: { 
      label: 'Départements', 
      icon: Settings, 
      type: 'dropdown',
      section: 'dropdowns',
      fields: ['name', 'description']
    },
    creators: { 
      label: 'Créateurs', 
      icon: User, 
      type: 'dropdown',
      section: 'dropdowns',
      fields: ['name']
    },
    
    // 👥 DONNÉES ADMIN
    technicians: { 
      label: 'Techniciens', 
      icon: Users, 
      type: 'admin',
      section: 'admin',
      fields: ['name', 'specialty', 'phone', 'email'],
      description: 'Équipe technique'
    },
    suppliers: { 
      label: 'Fournisseurs', 
      icon: Package, 
      type: 'admin',
      section: 'admin',
      fields: ['name', 'contact', 'phone', 'email', 'address'],
      description: 'Partenaires fournisseurs'
    },
    equipment: { 
      label: 'Équipements', 
      icon: Hammer, 
      type: 'admin',
      section: 'admin',
      fields: ['name', 'category', 'reference', 'unitPrice', 'supplier'],
      description: 'Catalogue produits'
    }
  };

  const currentCategoryConfig = categories[activeCategory];
  const currentItems = data[activeCategory] || [];

  // Filtrer les items
  const filteredItems = useMemo(() => {
    let items = currentItems;

    // Filtre par statut
    if (filterActive === 'active') {
      items = items.filter(item => item.active !== false);
    } else if (filterActive === 'inactive') {
      items = items.filter(item => item.active === false);
    }

    // Filtre par recherche
    if (searchTerm.trim().length >= 2) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name?.toLowerCase().includes(term) ||
        item.specialty?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    return items;
  }, [currentItems, searchTerm, filterActive]);

  // Grouper les catégories par section
  const groupedCategories = useMemo(() => {
    const groups = {
      dropdowns: { label: 'Listes déroulantes', items: [] },
      admin: { label: 'Données administrateur', items: [] }
    };

    Object.entries(categories).forEach(([key, config]) => {
      groups[config.section].items.push({ key, ...config });
    });

    return groups;
  }, []);
    if (!isOpen) return null;
  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    setIsSaving(true);

    try {
      let result;
      if (editingItem) {
        result = await onUpdateItem(activeCategory, editingItem.id, formData);
      } else {
        result = await onAddItem(activeCategory, formData);
      }

      if (result.success) {
        resetForm();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?\n\nCette action est irréversible si l'élément n'est pas utilisé.`)) {
      return;
    }

    const result = await onDeleteItem(activeCategory, item.id);
    
    if (result.disabled) {
      alert('L\'élément est utilisé dans des interventions. Il a été désactivé au lieu d\'être supprimé.');
    }
  };

  const handleToggle = async (item) => {
    await onToggleActive(activeCategory, item.id, item.active);
  };

  const renderFormFields = () => {
    const fields = currentCategoryConfig.fields;

    return fields.map(field => {
      switch (field) {
        case 'name':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Nom de l'élément"
                required
              />
            </div>
          );

        case 'description':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows="2"
                placeholder="Description optionnelle"
              />
            </div>
          );

        case 'specialty':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Spécialité
              </label>
              <input
                type="text"
                value={formData.specialty || ''}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Plomberie, Électricité..."
              />
            </div>
          );

        case 'phone':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="06 12 34 56 78"
              />
            </div>
          );

        case 'email':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="email@exemple.com"
              />
            </div>
          );

        case 'contact':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact *
              </label>
              <input
                type="text"
                value={formData.contact || ''}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Nom du contact"
                required
              />
            </div>
          );

        case 'address':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows="2"
                placeholder="Adresse complète"
              />
            </div>
          );

        case 'category':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catégorie *
              </label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Plomberie, Électricité..."
                required
              />
            </div>
          );

        case 'reference':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Référence
              </label>
              <input
                type="text"
                value={formData.reference || ''}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Réf. produit"
              />
            </div>
          );

        case 'unitPrice':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prix unitaire (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice || ''}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
          );

        case 'color':
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur
              </label>
              <div className="flex gap-2">
                {['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full bg-${color}-500 border-2 ${
                      formData.color === color ? 'border-gray-800 dark:border-white' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          );

        default:
          return null;
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Gestion des données de référence
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gérez toutes les listes et options depuis un seul endroit
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Navigation */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              {Object.entries(groupedCategories).map(([sectionKey, section]) => (
                <div key={sectionKey} className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                    {section.label}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map(category => {
                      const Icon = category.icon;
                      const count = data[category.key]?.length || 0;
                      const activeCount = data[category.key]?.filter(item => item.active !== false).length || 0;

                      return (
                        <button
                          key={category.key}
                          onClick={() => {
                            setActiveCategory(category.key);
                            resetForm();
                            setSearchTerm('');
                            setFilterActive('all');
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between ${
                            activeCategory === category.key
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Icon size={18} className="flex-shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {category.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs font-medium">{activeCount}</span>
                            {count !== activeCount && (
                              <span className="text-xs text-gray-400">/{count}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Tous</option>
                  <option value="active">Actifs uniquement</option>
                  <option value="inactive">Inactifs uniquement</option>
                </select>

                <button
                  onClick={() => {
                    resetForm();
                    setFormData({ active: true });
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  Ajouter
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <currentCategoryConfig.icon size={18} className="text-gray-500" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {currentCategoryConfig.label}
                  </span>
                  {currentCategoryConfig.description && (
                    <span className="text-gray-500 dark:text-gray-400">
                      • {currentCategoryConfig.description}
                    </span>
                  )}
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    {editingItem ? (
                      <>
                        <Edit3 size={18} />
                        Modifier l'élément
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Nouvel élément
                      </>
                    )}
                  </h3>

                  <div className="space-y-3">
                    {renderFormFields()}

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={isSaving || !formData.name?.trim()}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            {editingItem ? 'Modifier' : 'Ajouter'}
                          </>
                        )}
                      </button>

                      {editingItem && (
                        <button
                          onClick={resetForm}
                          disabled={isSaving}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      Liste ({filteredItems.length})
                    </h3>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto p-3 space-y-2">
                    {filteredItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800 dark:text-white truncate">
                              {item.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                              item.active !== false
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-500 dark:text-gray-300'
                            }`}>
                              {item.active !== false ? 'Actif' : 'Inactif'}
                            </span>
                          </div>

                          {(item.description || item.specialty || item.contact || item.category) && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              {item.description || item.specialty || item.contact || item.category}
                            </p>
                          )}

                          {(item.phone || item.email) && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {item.phone} {item.phone && item.email && '•'} {item.email}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1 ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                            title="Modifier"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={() => handleToggle(item)}
                            className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition"
                            title={item.active ? 'Désactiver' : 'Activer'}
                          >
                            {item.active !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredItems.length === 0 && (
                      <div className="text-center py-12">
                        <currentCategoryConfig.icon size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchTerm || filterActive !== 'all'
                            ? 'Aucun élément trouvé'
                            : 'Aucun élément. Ajoutez-en un !'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300">
                <Info size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">💡 Conseils</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Les éléments <strong>inactifs</strong> n'apparaissent pas dans les listes de sélection</li>
                    <li>• Les éléments <strong>utilisés</strong> dans des interventions ne peuvent pas être supprimés (seulement désactivés)</li>
                    <li>• Pour les <strong>localisations</strong>, aucun doublon n'est autorisé</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAdminModal;