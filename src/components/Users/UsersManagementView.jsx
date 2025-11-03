// src/components/Users/UsersManagementView.jsx - VERSION COMPLETE CORRIGEE

import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Mail, Trash2, UserX, UserCheck } from 'lucide-react';
import UserManagementModal from './UserManagementModal';
import { useUnifiedData } from '../../hooks/useUnifiedData'; // ← IMPORTANT : Importer

const UsersManagementView = ({ 
  users = [], 
  currentUser,
  onEditUser,  
  onUpdateUser, 
  onAddUser,
  onUpdateUserPassword,
  onDeleteUser,
  onActivateUser,  
  onResetPassword  
}) => {
  // ✨ NOUVEAU : Charger adminData
  const { data: adminData, loading: adminDataLoading } = useUnifiedData(currentUser);

  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtrage des utilisateurs
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.active !== false) ||
        (statusFilter === 'inactive' && user.active === false);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const getRoleLabel = (role) => {
    const roles = {
      superadmin: 'Super Admin',
      manager: 'Manager',
      technician: 'Technicien',
      reception: 'Réception'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      technician: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      reception: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[role] || colors.reception;
  };

  const getStatusColor = (active) => {
    return active 
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const canEditUser = (user) => {
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'manager' && user.role !== 'superadmin') return true;
    return currentUser.uid === user.id;
  };

  const canDeleteUser = (user) => {
    if (user.id === currentUser.uid) return false;
    if (currentUser.role === 'superadmin' && user.role !== 'superadmin') return true;
    return currentUser.role === 'manager' && (user.role === 'reception' || user.role === 'technician');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {users.length} utilisateur(s) au total
          </p>
        </div>
        
        <button
          onClick={onAddUser}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Barre de recherche */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Filtre par rôle */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="all">Tous les rôles</option>
            <option value="superadmin">Super Admin</option>
            <option value="manager">Manager</option>
            <option value="technician">Technicien</option>
            <option value="reception">Réception</option>
          </select>

          {/* Filtre par statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredUsers.map(user => (
              <div key={user.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    {/* Infos utilisateur */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                          {user.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {user.department && (
                          <span>📍 {user.department}</span>
                        )}
                        {user.phone && (
                          <span>📞 {user.phone}</span>
                        )}
                        <span className={`font-medium ${getStatusColor(user.active !== false)}`}>
                          {user.active !== false ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {canEditUser(user) && (
                      <>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        
                        {user.id !== currentUser.uid && (
                          <button
                            onClick={() => onUpdateUserPassword(user)}
                            className="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Modifier le mot de passe"
                          >
                            <Mail size={16} />
                          </button>
                        )}
                      </>
                    )}
                    
                    {canDeleteUser(user) && (
                      <button
                        onClick={() => onDeleteUser(user)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Désactiver"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Aucun utilisateur ne correspond à vos critères de recherche.'
                : 'Commencez par ajouter votre premier utilisateur.'}
            </p>
          </div>
        )}
      </div>

      {/* ✨ MODAL UTILISATEUR AVEC adminData */}
      {selectedUser && (
        <UserManagementModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
          onUpdateUser={onUpdateUser}  // ← ✅ Fonction de sauvegarde
          onResetPassword={onResetPassword}  // ← ✅ Fonction de reset password
          onDeleteUser={onDeleteUser}
          onActivateUser={onActivateUser}  // ← ✅ Fonction d'activation
          adminData={adminData}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default UsersManagementView;