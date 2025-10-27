import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Save, XCircle, Building, Wrench, AlertTriangle } from 'lucide-react';

const DynamicDropdownsModal = ({ isOpen, onClose, dropdowns, onUpdateDropdowns }) => {
  const [localDropdowns, setLocalDropdowns] = useState(dropdowns);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ type: 'types', value: '' });

  if (!isOpen) return null;

  const dropdownTypes = [
    { id: 'types', label: 'Types d\'intervention', icon: Wrench },
    { id: 'batiments', label: 'Bâtiments', icon: Building },
    { id: 'urgences', label: 'Niveaux d\'urgence', icon: AlertTriangle }
  ];

  const handleAddItem = () => {
    if (!newItem.value.trim()) return;

    const updatedDropdowns = {
      ...localDropdowns,
      [newItem.type]: [...(localDropdowns[newItem.type] || []), newItem.value.trim()]
    };

    setLocalDropdowns(updatedDropdowns);
    setNewItem({ type: 'types', value: '' });
  };

  const handleEditItem = (type, index, newValue) => {
    const updatedDropdowns = {
      ...localDropdowns,
      [type]: localDropdowns[type].map((item, i) => i === index ? newValue : item)
    };
    setLocalDropdowns(updatedDropdowns);
    setEditingItem(null);
  };

  const handleDeleteItem = (type, index) => {
    const updatedDropdowns = {
      ...localDropdowns,
      [type]: localDropdowns[type].filter((_, i) => i !== index)
    };
    setLocalDropdowns(updatedDropdowns);
  };

  const handleSave = () => {
    onUpdateDropdowns(localDropdowns);
    onClose();
  };

  const handleReset = () => {
    setLocalDropdowns(dropdowns);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Gestion des Listes Déroulantes
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Ajout d'un nouvel élément */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                Ajouter un élément
              </h3>
              <div className="flex gap-3">
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  {dropdownTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newItem.value}
                  onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                  placeholder="Nouvelle valeur..."
                  className="flex-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>
            </div>

            {/* Liste des éléments par type */}
            {dropdownTypes.map(dropdownType => (
              <div key={dropdownType.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <dropdownType.icon size={18} className="text-gray-600 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {dropdownType.label}
                    </h3>
                    <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                      {localDropdowns[dropdownType.id]?.length || 0} éléments
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  {localDropdowns[dropdownType.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {localDropdowns[dropdownType.id].map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          {editingItem?.type === dropdownType.id && editingItem?.index === index ? (
                            <>
                              <input
                                type="text"
                                value={editingItem.value}
                                onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-800 dark:text-white"
                                autoFocus
                              />
                              <button
                                onClick={() => handleEditItem(dropdownType.id, index, editingItem.value)}
                                className="p-1 text-green-600 hover:text-green-700"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-gray-800 dark:text-gray-200">{item}</span>
                              <button
                                onClick={() => setEditingItem({ type: dropdownType.id, index, value: item })}
                                className="p-1 text-blue-600 hover:text-blue-700"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(dropdownType.id, index)}
                                className="p-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      Aucun élément dans cette liste
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Annuler les modifications
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicDropdownsModal;