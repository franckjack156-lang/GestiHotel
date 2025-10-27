import React from 'react';
import { Settings, Users, Package, Hammer, BarChart, Plus } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminOptionsView = ({ 
  adminOptions, 
  loading,
  onManageOptions 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Chargement des options..." />
      </div>
    );
  }

  const stats = {
    technicians: adminOptions.technicians?.length || 0,
    suppliers: adminOptions.suppliers?.length || 0,
    equipment: adminOptions.equipment?.length || 0,
    activeTechnicians: adminOptions.technicians?.filter(tech => tech.active !== false).length || 0,
    activeSuppliers: adminOptions.suppliers?.filter(sup => sup.active !== false).length || 0,
    activeEquipment: adminOptions.equipment?.filter(eq => eq.active !== false).length || 0
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Options Administrateur
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les données de référence de l'application
          </p>
        </div>
        <button
          onClick={onManageOptions}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Settings size={20} />
          Gérer les options
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Techniciens</p>
              <p className="text-3xl font-bold">{stats.technicians}</p>
              <p className="text-xs opacity-80">{stats.activeTechnicians} actifs</p>
            </div>
            <Users size={32} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Fournisseurs</p>
              <p className="text-3xl font-bold">{stats.suppliers}</p>
              <p className="text-xs opacity-80">{stats.activeSuppliers} actifs</p>
            </div>
            <Package size={32} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Équipements</p>
              <p className="text-3xl font-bold">{stats.equipment}</p>
              <p className="text-xs opacity-80">{stats.activeEquipment} actifs</p>
            </div>
            <Hammer size={32} className="opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Techniciens */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Users size={24} className="text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">Techniciens</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.technicians} au total • {stats.activeTechnicians} actifs
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {adminOptions.technicians?.slice(0, 5).map(tech => (
              <div key={tech.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 dark:text-white">{tech.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tech.active !== false 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-500 dark:text-gray-200'
                    }`}>
                      {tech.active !== false ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  {tech.specialty && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{tech.specialty}</p>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {tech.phone && <span>{tech.phone}</span>}
                    {tech.phone && tech.email && <span> • </span>}
                    {tech.email && <span>{tech.email}</span>}
                  </div>
                </div>
              </div>
            ))}
            {(!adminOptions.technicians || adminOptions.technicians.length === 0) && (
              <div className="text-center py-6">
                <Users size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun technicien</p>
              </div>
            )}
            {adminOptions.technicians && adminOptions.technicians.length > 5 && (
              <button
                onClick={onManageOptions}
                className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 py-2"
              >
                Voir tous les {adminOptions.technicians.length} techniciens
              </button>
            )}
          </div>
        </div>

        {/* Fournisseurs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <Package size={24} className="text-green-600 dark:text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">Fournisseurs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.suppliers} au total • {stats.activeSuppliers} actifs
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {adminOptions.suppliers?.slice(0, 5).map(supplier => (
              <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-white">{supplier.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Contact: {supplier.contact}</p>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {supplier.phone && <span>{supplier.phone}</span>}
                    {supplier.phone && supplier.email && <span> • </span>}
                    {supplier.email && <span>{supplier.email}</span>}
                  </div>
                </div>
              </div>
            ))}
            {(!adminOptions.suppliers || adminOptions.suppliers.length === 0) && (
              <div className="text-center py-6">
                <Package size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun fournisseur</p>
              </div>
            )}
            {adminOptions.suppliers && adminOptions.suppliers.length > 5 && (
              <button
                onClick={onManageOptions}
                className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 py-2"
              >
                Voir tous les {adminOptions.suppliers.length} fournisseurs
              </button>
            )}
          </div>
        </div>

        {/* Équipements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <Hammer size={24} className="text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">Équipements</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.equipment} au total • {stats.activeEquipment} actifs
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {adminOptions.equipment?.slice(0, 5).map(equipment => (
              <div key={equipment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-white">{equipment.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Catégorie: {equipment.category}</p>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {equipment.reference && <span>Réf: {equipment.reference}</span>}
                    {equipment.reference && equipment.unitPrice && <span> • </span>}
                    {equipment.unitPrice && <span>Prix: {equipment.unitPrice}€</span>}
                  </div>
                </div>
              </div>
            ))}
            {(!adminOptions.equipment || adminOptions.equipment.length === 0) && (
              <div className="text-center py-6">
                <Hammer size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun équipement</p>
              </div>
            )}
            {adminOptions.equipment && adminOptions.equipment.length > 5 && (
              <button
                onClick={onManageOptions}
                className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 py-2"
              >
                Voir tous les {adminOptions.equipment.length} équipements
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onManageOptions}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                <Users size={20} className="text-blue-600 dark:text-blue-300" />
              </div>
              <Plus size={16} className="text-blue-600 dark:text-blue-300" />
            </div>
            <p className="font-medium text-blue-900 dark:text-blue-100">Ajouter un technicien</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Nouveau membre de l'équipe</p>
          </button>

          <button
            onClick={onManageOptions}
            className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg">
                <Package size={20} className="text-green-600 dark:text-green-300" />
              </div>
              <Plus size={16} className="text-green-600 dark:text-green-300" />
            </div>
            <p className="font-medium text-green-900 dark:text-green-100">Ajouter un fournisseur</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">Nouveau partenaire</p>
          </button>

          <button
            onClick={onManageOptions}
            className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-lg">
                <Hammer size={20} className="text-orange-600 dark:text-orange-300" />
              </div>
              <Plus size={16} className="text-orange-600 dark:text-orange-300" />
            </div>
            <p className="font-medium text-orange-900 dark:text-orange-100">Ajouter un équipement</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">Nouveau matériel</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOptionsView;