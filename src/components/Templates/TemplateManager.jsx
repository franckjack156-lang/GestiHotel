// src/components/Templates/TemplateManager.jsx

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Edit2,
  Trash2,
  Plus,
  Search,
  Star,
  CheckSquare,
  Clock,
  AlertCircle,
  Save,
  X,
  FileText,
  Tag,
  TrendingUp,
  List,
  Grid
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useOptimizedFirestore } from '../../hooks/useOptimizedFirestore';

/**
 * Gestionnaire de templates d'interventions
 * - Création de templates réutilisables
 * - Checklists prédéfinies
 * - Statistiques d'utilisation
 * - Duplication et modification
 */
const TemplateManager = ({ user, onUseTemplate, onClose }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [filterCategory, setFilterCategory] = useState('all');

  // Charger les templates
  const { data: templates, loading, refresh } = useOptimizedFirestore('interventionTemplates', {
    orderByFields: [['usageCount', 'desc']],
    realtime: true
  });

  // Filtrer les templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = 
      filterCategory === 'all' || template.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Catégories uniques
  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

  // Utiliser un template
  const handleUseTemplate = async (template) => {
    try {
      // Incrémenter le compteur d'utilisation
      await updateDoc(doc(db, 'interventionTemplates', template.id), {
        usageCount: increment(1),
        lastUsed: serverTimestamp()
      });

      // Créer une nouvelle intervention basée sur le template
      const interventionData = {
        missionSummary: template.name,
        description: template.instructions || '',
        missionType: template.missionType || '',
        interventionType: template.interventionType || '',
        priority: template.priority || 'normal',
        estimatedDuration: template.estimatedDuration,
        assignedTo: template.defaultAssignee || null,
        checklistItems: template.checklistItems?.map((item, index) => ({
          ...item,
          id: `check_${Date.now()}_${index}`,
          completed: false
        })) || [],
        templateId: template.id
      };

      onUseTemplate?.(interventionData);
      onClose?.();
    } catch (error) {
      console.error('Erreur utilisation template:', error);
    }
  };

  // Dupliquer un template
  const handleDuplicate = async (template) => {
    try {
      const newTemplate = {
        ...template,
        name: `${template.name} (Copie)`,
        usageCount: 0,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        lastUsed: null
      };

      delete newTemplate.id;
      await addDoc(collection(db, 'interventionTemplates'), newTemplate);
      refresh();
    } catch (error) {
      console.error('Erreur duplication template:', error);
    }
  };

  // Supprimer un template
  const handleDelete = async (templateId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      await deleteDoc(doc(db, 'interventionTemplates', templateId));
      refresh();
    } catch (error) {
      console.error('Erreur suppression template:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Templates d'interventions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Créez et réutilisez des modèles d'interventions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Barre d'outils */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex gap-3">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un template..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Mode d'affichage */}
            <div className="flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <List size={20} />
              </button>
            </div>

            {/* Nouveau template */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              Nouveau template
            </button>
          </div>

          {/* Filtres par catégorie */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tous ({templates.length})
            </button>
            {categories.map(category => {
              const count = templates.filter(t => t.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filterCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des templates */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun template trouvé</p>
              <p className="text-sm">Créez votre premier template pour commencer</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  viewMode={viewMode}
                  onUse={() => handleUseTemplate(template)}
                  onEdit={() => setSelectedTemplate(template)}
                  onDuplicate={() => handleDuplicate(template)}
                  onDelete={() => handleDelete(template.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création/édition */}
      {(showCreateModal || selectedTemplate) && (
        <TemplateEditorModal
          template={selectedTemplate}
          user={user}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTemplate(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setSelectedTemplate(null);
            refresh();
          }}
        />
      )}
    </div>
  );
};

/**
 * Carte de template
 */
const TemplateCard = ({ template, viewMode, onUse, onEdit, onDuplicate, onDelete }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {template.name}
              </h3>
              {template.category && (
                <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                  {template.category}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {template.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {template.checklistItems?.length > 0 && (
                <span className="flex items-center gap-1">
                  <CheckSquare size={16} />
                  {template.checklistItems.length} étapes
                </span>
              )}
              {template.estimatedDuration && (
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {template.estimatedDuration} min
                </span>
              )}
              {template.usageCount > 0 && (
                <span className="flex items-center gap-1">
                  <TrendingUp size={16} />
                  Utilisé {template.usageCount}×
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUse}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Utiliser
            </button>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={onDuplicate}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-5 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            {template.name}
          </h3>
          {template.category && (
            <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
              {template.category}
            </span>
          )}
        </div>
        
        {template.priority && (
          <span className={`px-2 py-1 text-xs rounded ${
            template.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
            template.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
            template.priority === 'normal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
            'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
          }`}>
            {template.priority === 'urgent' ? 'Urgent' :
             template.priority === 'high' ? 'Haute' :
             template.priority === 'normal' ? 'Normale' : 'Basse'}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
        {template.description || 'Aucune description'}
      </p>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        {template.checklistItems?.length > 0 && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <CheckSquare size={16} />
            <span>{template.checklistItems.length} étapes</span>
          </div>
        )}
        {template.estimatedDuration && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock size={16} />
            <span>{template.estimatedDuration} min</span>
          </div>
        )}
        {template.usageCount > 0 && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <TrendingUp size={16} />
            <span>{template.usageCount} utilisations</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {template.tags?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
            >
              #{tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onUse}
          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Utiliser
        </button>
        <button
          onClick={onEdit}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          title="Modifier"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={onDuplicate}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          title="Dupliquer"
        >
          <Copy size={18} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 border border-red-300 dark:border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Supprimer"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

/**
 * Modal d'édition de template
 */
const TemplateEditorModal = ({ template, user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || '',
    missionType: template?.missionType || '',
    interventionType: template?.interventionType || '',
    priority: template?.priority || 'normal',
    estimatedDuration: template?.estimatedDuration || '',
    defaultAssignee: template?.defaultAssignee || '',
    instructions: template?.instructions || '',
    safetyNotes: template?.safetyNotes || '',
    tags: template?.tags || [],
    checklistItems: template?.checklistItems || []
  });

  const [newTag, setNewTag] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const handleSave = async () => {
    try {
      const templateData = {
        ...formData,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      };

      if (template?.id) {
        // Mise à jour
        await updateDoc(doc(db, 'interventionTemplates', template.id), templateData);
      } else {
        // Création
        await addDoc(collection(db, 'interventionTemplates'), {
          ...templateData,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          usageCount: 0
        });
      }

      onSave?.();
    } catch (error) {
      console.error('Erreur sauvegarde template:', error);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addChecklistItem = () => {
    if (newChecklistItem) {
      setFormData({
        ...formData,
        checklistItems: [
          ...formData.checklistItems,
          {
            text: newChecklistItem,
            required: true,
            order: formData.checklistItems.length
          }
        ]
      });
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklistItems: formData.checklistItems.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {template ? 'Modifier le template' : 'Nouveau template'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du template *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Basse</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durée estimée (minutes)
              </label>
              <input
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || '' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Checklist des étapes
            </label>
            <div className="space-y-2 mb-3">
              {formData.checklistItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <CheckSquare size={18} className="text-gray-400" />
                  <span className="flex-1 text-gray-700 dark:text-gray-300">
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeChecklistItem(index)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                placeholder="Ajouter une étape..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={addChecklistItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tags
            </label>
            <div className="flex gap-2 flex-wrap mb-3">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center gap-2 text-sm"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-indigo-900 dark:hover:text-indigo-100"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Ajouter un tag..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Instructions et notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instructions détaillées
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Instructions pas à pas pour cette intervention..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-500" />
              Notes de sécurité
            </label>
            <textarea
              value={formData.safetyNotes}
              onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-orange-300 dark:border-orange-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Précautions de sécurité à prendre..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} />
            {template ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;