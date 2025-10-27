import React, { useState } from 'react';
import { 
  X, Home, MapPin, ClipboardList, User, Hammer, AlertCircle, 
  Users, Package, List, Settings, Plus, Edit3, Trash2, Eye, EyeOff,
  Save, Info
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const UnifiedDataManagementModal = ({ 
  isOpen, 
  onClose, 
  dropdowns,
  adminOptions,
  addDropdownItem,
  updateDropdownItem,
  deleteDropdownItem,
  toggleDropdownItemActive,
  addTechnician,
  updateTechnician,
  deleteTechnician,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  addEquipment,
  updateEquipment,
  deleteEquipment
}) => {
  const [activeTab, setActiveTab] = useState('roomTypes');
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  // États pour tous les formulaires
  const [dropdownForm, setDropdownForm] = useState({ name: '', value: '', description: '' });
  const [technicianForm, setTechnicianForm] = useState({ 
    name: '', 
    specialty: '', 
    phone: '', 
    email: '', 
    active: true 
  });
  const [supplierForm, setSupplierForm] = useState({ 
    name: '', 
    contact: '', 
    phone: '', 
    email: '', 
    address: '' 
  });
  const [equipmentForm, setEquipmentForm] = useState({ 
    name: '', 
    category: '', 
    supplier: '', 
    reference: '', 
    unitPrice: '' 
  });

  // Configuration des catégories
  const categories = {
    // Listes déroulantes
    roomTypes: { label: 'Types de locaux', icon: Home, type: 'dropdown' },
    locations: { label: 'Localisations', icon: MapPin, type: 'dropdown' },
    missionTypes: { label: 'Types de mission', icon: ClipboardList, type: 'dropdown' },
    creators: { label: 'Créateurs', icon: User, type: 'dropdown' },
    interventionTypes: { label: 'Types d\'intervention', icon: Hammer, type: 'dropdown' },
    priorities: { label: 'Priorités', icon: AlertCircle, type: 'dropdown' },
    departments: { label: 'Départements', icon: Users, type: 'dropdown' },
    
    // Options administrateur
    technicians: { label: 'Techniciens', icon: Users, type: 'admin' },
    suppliers: { label: 'Fournisseurs', icon: Package, type: 'admin' },
    equipment: { label: 'Équipements', icon: Hammer, type: 'admin' }
  };

  const resetForms = () => {
    setDropdownForm({ name: '', value: '', description: '' });
    setTechnicianForm({ name: '', specialty: '', phone: '', email: '', active: true });
    setSupplierForm({ name: '', contact: '', phone: '', email: '', address: '' });
    setEquipmentForm({ name: '', category: '', supplier: '', reference: '', unitPrice: '' });
    setEditingItem(null);
  };

  // Gestionnaire unifié pour l'ajout/modification
  const handleSaveItem = async () => {
    setIsLoading(true);
    let result;

    try {
      const category = categories[activeTab];
      
      if (category.type === 'dropdown') {
        if (!dropdownForm.name.trim()) {
          addToast('Le nom est obligatoire', 'error');
          setIsLoading(false);
          return;
        }

        const itemData = {
          name: dropdownForm.name,
          value: dropdownForm.value || dropdownForm.name.toLowerCase().replace(/\s+/g, '-'),
          label: dropdownForm.name,
          description: dropdownForm.description || '',
          active: true
        };

        result = editingItem 
          ? await updateDropdownItem(editingItem.id, itemData)
          : await addDropdownItem(activeTab, itemData);

      } else if (category.type === 'admin') {
        if (activeTab === 'technicians') {
          if (!technicianForm.name.trim()) {
            addToast('Le nom du technicien est obligatoire', 'error');
            setIsLoading(false);
            return;
          }
          result = editingItem 
            ? await updateTechnician(editingItem.id, technicianForm)
            : await addTechnician(technicianForm);
            
        } else if (activeTab === 'suppliers') {
          if (!supplierForm.name.trim() || !supplierForm.contact.trim()) {
            addToast('Le nom du fournisseur et le contact sont obligatoires', 'error');
            setIsLoading(false);
            return;
          }
          result = editingItem 
            ? await updateSupplier(editingItem.id, supplierForm)
            : await addSupplier(supplierForm);
            
        } else if (activeTab === 'equipment') {
          if (!equipmentForm.name.trim() || !equipmentForm.category.trim()) {
            addToast('Le nom et la catégorie sont obligatoires', 'error');
            setIsLoading(false);
            return;
          }
          result = editingItem 
            ? await updateEquipment(editingItem.id, equipmentForm)
            : await addEquipment(equipmentForm);
        }
      }

      if (result?.success) {
        addToast(editingItem ? 'Élément modifié avec succès' : 'Élément ajouté avec succès', 'success');
        resetForms();
      }
    } catch (error) {
      addToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const category = categories[activeTab];

    if (category.type === 'dropdown') {
      setDropdownForm({
        name: item.name || '',
        value: item.value || '',
        description: item.description || ''
      });
    } else if (category.type === 'admin') {
      if (activeTab === 'technicians') {
        setTechnicianForm({
          name: item.name || '',
          specialty: item.specialty || '',
          phone: item.phone || '',
          email: item.email || '',
          active: item.active !== false
        });
      } else if (activeTab === 'suppliers') {
        setSupplierForm({
          name: item.name || '',
          contact: item.contact || '',
          phone: item.phone || '',
          email: item.email || '',
          address: item.address || ''
        });
      } else if (activeTab === 'equipment') {
        setEquipmentForm({
          name: item.name || '',
          category: item.category || '',
          supplier: item.supplier || '',
          reference: item.reference || '',
          unitPrice: item.unitPrice || ''
        });
      }
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    setIsLoading(true);
    const category = categories[activeTab];
    let result;

    try {
      if (category.type === 'dropdown') {
        result = await deleteDropdownItem(itemId);
      } else if (category.type === 'admin') {
        if (activeTab === 'technicians') result = await deleteTechnician(itemId);
        else if (activeTab === 'suppliers') result = await deleteSupplier(itemId);
        else if (activeTab === 'equipment') result = await deleteEquipment(itemId);
      }

      if (result?.success) {
        addToast('Élément supprimé avec succès', 'success');
      }
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (item) => {
    setIsLoading(true);
    try {
      await toggleDropdownItemActive(item.id, item.active);
      addToast(`Élément ${!item.active ? 'activé' : 'désactivé'} avec succès`, 'success');
    } catch (error) {
      addToast('Erreur lors du changement de statut', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir les données actuelles
  const getCurrentItems = () => {
    const category = categories[activeTab];
    if (category.type === 'dropdown') {
      return dropdowns[activeTab] || [];
    } else if (category.type === 'admin') {
      return adminOptions[activeTab] || [];
    }
    return [];
  };

  if (!isOpen) return null;

  const currentItems = getCurrentItems();
  const currentCategory = categories[activeTab];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Gestion des données de référence
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gérez toutes les listes et options depuis un seul endroit
              </p>
            </div>
            <button 
              onClick={() => { onClose(); resetForms(); }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              disabled={isLoading}
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation par sections */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border-2 border-indigo-200 dark:border-indigo-700">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                  <List size={18} />
                  Listes déroulantes
                </h3>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  Types, localisations, missions, priorités...
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border-2 border-emerald-200 dark:border-emerald-700">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-2">
                  <Settings size={18} />
                  Options administrateur
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Techniciens, fournisseurs, équipements
                </p>
              </div>
            </div>

            {/* Navigation par onglets */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex gap-2 overflow-x-auto pb-2">
                {Object.entries(categories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); resetForms(); }}
                    className={`py-2 px-3 font-medium text-sm rounded-t-lg transition flex items-center gap-2 whitespace-nowrap ${
                      activeTab === key
                        ? category.type === 'dropdown'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-500'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    disabled={isLoading}
                  >
                    <category.icon size={16} />
                    {category.label}
                    <span className="bg-white dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {getCurrentItems().length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {isLoading && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Chargement...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire unifié */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                {editingItem ? <Edit3 size={18} /> : <Plus size={18} />}
                {editingItem ? 'Modifier' : 'Ajouter'} {currentCategory.label.toLowerCase()}
              </h3>
              
              <div className="space-y-3">
                {/* Formulaire pour listes déroulantes */}
                {currentCategory.type === 'dropdown' && (
                  <>
                    <input
                      type="text"
                      placeholder="Nom *"
                      value={dropdownForm.name}
                      onChange={(e) => setDropdownForm({...dropdownForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      placeholder="Valeur technique (optionnel)"
                      value={dropdownForm.value}
                      onChange={(e) => setDropdownForm({...dropdownForm, value: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <textarea
                      placeholder="Description (optionnel)"
                      value={dropdownForm.description}
                      onChange={(e) => setDropdownForm({...dropdownForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      rows="2"
                      disabled={isLoading}
                    />
                  </>
                )}

                {/* Formulaire pour techniciens */}
                {activeTab === 'technicians' && (
                  <>
                    <input
                      type="text"
                      placeholder="Nom du technicien *"
                      value={technicianForm.name}
                      onChange={(e) => setTechnicianForm({...technicianForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      placeholder="Spécialité (optionnel)"
                      value={technicianForm.specialty}
                      onChange={(e) => setTechnicianForm({...technicianForm, specialty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="tel"
                      placeholder="Téléphone (optionnel)"
                      value={technicianForm.phone}
                      onChange={(e) => setTechnicianForm({...technicianForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="email"
                      placeholder="Email (optionnel)"
                      value={technicianForm.email}
                      onChange={(e) => setTechnicianForm({...technicianForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={technicianForm.active}
                        onChange={(e) => setTechnicianForm({...technicianForm, active: e.target.checked})}
                        className="text-emerald-600 focus:ring-emerald-500"
                        disabled={isLoading}
                      />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Actif</label>
                    </div>
                  </>
                )}

                {/* Formulaire pour fournisseurs */}
                {activeTab === 'suppliers' && (
                  <>
                    <input
                      type="text"
                      placeholder="Nom du fournisseur *"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      placeholder="Personne à contacter *"
                      value={supplierForm.contact}
                      onChange={(e) => setSupplierForm({...supplierForm, contact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <textarea
                      placeholder="Adresse (optionnel)"
                      value={supplierForm.address}
                      onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      rows="2"
                      disabled={isLoading}
                    />
                  </>
                )}

                {/* Formulaire pour équipements */}
                {activeTab === 'equipment' && (
                  <>
                    <input
                      type="text"
                      placeholder="Nom de l'équipement *"
                      value={equipmentForm.name}
                      onChange={(e) => setEquipmentForm({...equipmentForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      placeholder="Catégorie *"
                      value={equipmentForm.category}
                      onChange={(e) => setEquipmentForm({...equipmentForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      placeholder="Référence (optionnel)"
                      value={equipmentForm.reference}
                      onChange={(e) => setEquipmentForm({...equipmentForm, reference: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <input
                      type="number"
                      placeholder="Prix unitaire € (optionnel)"
                      value={equipmentForm.unitPrice}
                      onChange={(e) => setEquipmentForm({...equipmentForm, unitPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    />
                    <select
                      value={equipmentForm.supplier}
                      onChange={(e) => setEquipmentForm({...equipmentForm, supplier: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {adminOptions?.suppliers?.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {/* Boutons d'action */}
                <button
                  onClick={handleSaveItem}
                  disabled={isLoading}
                  className={`w-full text-white py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    currentCategory.type === 'dropdown' 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : editingItem ? (
                    <>
                      <Save size={18} />
                      Modifier
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Ajouter
                    </>
                  )}
                </button>
                
                {editingItem && (
                  <button
                    onClick={resetForms}
                    disabled={isLoading}
                    className="w-full bg-gray-500 text-white py-2 rounded-lg font-medium hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {/* Liste des éléments */}
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg max-h-[500px] overflow-y-auto">
              <h3 className="font-semibold text-gray-800 dark:text-white p-4 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-700">
                Liste des {currentCategory.label.toLowerCase()} ({currentItems.length})
              </h3>
              
              <div className="p-4 space-y-3">
                {currentItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-800 dark:text-white truncate">
                          {item.name}
                        </p>
                        {item.hasOwnProperty('active') && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            item.active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-500 dark:text-gray-200'
                          }`}>
                            {item.active ? 'Actif' : 'Inactif'}
                          </span>
                        )}
                      </div>
                      
                      {/* Affichage des détails selon le type */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                        {item.value && <div>Valeur: {item.value}</div>}
                        {item.specialty && <div>Spécialité: {item.specialty}</div>}
                        {item.contact && <div>Contact: {item.contact}</div>}
                        {item.category && <div>Catégorie: {item.category}</div>}
                        {item.description && <div className="truncate">{item.description}</div>}
                        {(item.phone || item.email) && (
                          <div className="truncate">
                            {item.phone} {item.phone && item.email && '•'} {item.email}
                          </div>
                        )}
                        {item.unitPrice && <div>Prix: {item.unitPrice}€</div>}
                        {item.reference && <div>Réf: {item.reference}</div>}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        disabled={isLoading}
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 ${
                          currentCategory.type === 'dropdown'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                        title="Modifier"
                      >
                        <Edit3 size={16} />
                      </button>
                      
                      {currentCategory.type === 'dropdown' && item.hasOwnProperty('active') && (
                        <button
                          onClick={() => handleToggleActive(item)}
                          disabled={isLoading}
                          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 ${
                            item.active 
                              ? 'text-orange-600 dark:text-orange-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}
                          title={item.active ? 'Désactiver' : 'Activer'}
                        >
                          {item.active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isLoading}
                        className="text-red-600 dark:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded transition disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {currentItems.length === 0 && (
                  <div className="text-center py-8">
                    <currentCategory.icon size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucun élément trouvé.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Ajoutez le premier {currentCategory.label.toLowerCase()}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Info size={18} />
              Informations
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• <strong>Listes déroulantes</strong> : Les éléments inactifs n'apparaîtront pas dans les menus de sélection</p>
              <p>• <strong>Options admin</strong> : Les techniciens, fournisseurs et équipements sont utilisés dans la gestion des interventions</p>
              <p>• Toutes les modifications sont synchronisées en temps réel avec Firestore</p>
              <p>• Utilisez les icônes 👁️ pour activer/désactiver les éléments sans les supprimer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDataManagementModal;