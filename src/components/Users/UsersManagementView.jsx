// ==========================================
// 👥 USERSMANAGEMENTVIEW - VERSION CORRIGÉE
// ==========================================
// Gestion complète des utilisateurs avec toutes les données admin

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Mail, 
  Trash2, 
  UserX, 
  UserCheck,
  Key,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import UserManagementModal from './UserManagementModal';
import { useUnifiedData } from '../../hooks/useUnifiedData';

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
  
  // ✅ CORRECTION MAJEURE: Charger les données admin
  const { data: adminData, loading: adminDataLoading } = useUnifiedData(currentUser);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // ==========================================
  // 🔍 FILTRAGE DES UTILISATEURS
  // ==========================================
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Recherche textuelle
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtre par rôle
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      // Filtre par statut
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.active !== false) ||
        (statusFilter === 'inactive' && user.active === false);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // ==========================================
  // 📊 STATISTIQUES
  // ==========================================
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.active !== false).length,
      inactive: users.filter(u => u.active === false).length,
      superadmin: users.filter(u => u.role === 'superadmin').length,
      manager: users.filter(u => u.role === 'manager').length,
      technician: users.filter(u => u.role === 'technician').length,
      reception: users.filter(u => u.role === 'reception').length
    };
  }, [users]);

  // ==========================================
  // ✏️ ACTIONS SUR LES UTILISATEURS
  // ==========================================
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (selectedUser) {
        // Mise à jour
        await onUpdateUser({ ...selectedUser, ...userData });
      } else {
        // Création
        await onAddUser(userData);
      }
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erreur sauvegarde utilisateur:', error);
      throw error;
    }
  };

  const handleDeleteUser = async (user) => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(user.id);
      return;
    }

    try {
      await onDeleteUser(user.id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await onUpdateUser({
        ...user,
        active: !user.active
      });
    } catch (error) {
      console.error('Erreur changement statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const handleResetPassword = async (user) => {
    if (confirm(`Réinitialiser le mot de passe de ${user.name || user.email} ?`)) {
      try {
        await onResetPassword(user.email);
        alert('Email de réinitialisation envoyé !');
      } catch (error) {
        console.error('Erreur réinitialisation:', error);
        alert('Erreur lors de la réinitialisation');
      }
    }
  };

  // ==========================================
  // 🎨 HELPERS VISUELS
  // ==========================================
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
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  // ==========================================
  // 🎨 RENDER
  // ==========================================
  return (
    <div className="space-y-6">
      
      {/* ========== EN-TÊTE ========== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} 
            {roleFilter !== 'all' && ` · ${getRoleLabel(roleFilter)}`}
            {statusFilter !== 'all' && ` · ${statusFilter === 'active' ? 'Actifs' : 'Inactifs'}`}
          </p>
        </div>

        <button
          onClick={handleCreateUser}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Nouvel utilisateur
        </button>
      </div>

      {/* ========== STATISTIQUES ========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Actifs</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Inactifs</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Techniciens</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.technician}</p>
        </div>
      </div>

      {/* ========== FILTRES ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtre rôle */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les rôles</option>
            <option value="superadmin">Super Admin</option>
            <option value="manager">Manager</option>
            <option value="technician">Technicien</option>
            <option value="reception">Réception</option>
          </select>

          {/* Filtre statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* ========== LISTE DES UTILISATEURS ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <UserX size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {/* Utilisateur */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name || 'Sans nom'}
                          {user.id === currentUser?.uid && (
                            <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">(Vous)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </td>

                    {/* Rôle */}
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.active !== false)}`}>
                        {user.active !== false ? 'Actif' : 'Inactif'}
                      </span>
                    </td>

                    {/* Dernière connexion */}
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('fr-FR') 
                        : 'Jamais'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        
                        {/* Éditer */}
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                          title="Éditer"
                        >
                          <Edit size={18} />
                        </button>

                        {/* Réinitialiser mot de passe */}
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition"
                          title="Réinitialiser le mot de passe"
                        >
                          <Key size={18} />
                        </button>

                        {/* Activer/Désactiver */}
                        {user.id !== currentUser?.uid && (
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`p-2 rounded-lg transition ${
                              user.active !== false
                                ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={user.active !== false ? 'Désactiver' : 'Activer'}
                          >
                            {user.active !== false ? <UserX size={18} /> : <UserCheck size={18} />}
                          </button>
                        )}

                        {/* Supprimer */}
                        {user.id !== currentUser?.uid && (
                          showDeleteConfirm === user.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                title="Confirmer la suppression"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                                title="Annuler"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========== MODAL DE GESTION ========== */}
      {isModalOpen && (
        <UserManagementModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSave={handleSaveUser}
          adminData={adminData} // ✅ CORRECTION: Passer adminData au modal
        />
      )}
    </div>
  );
};

export default UsersManagementView;