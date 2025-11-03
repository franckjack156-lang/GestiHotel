// ==========================================
// 📅 CALENDARVIEW - VERSION AMÉLIORÉE
// ==========================================
// Planning des interventions avec vues multiples et filtres avancés

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Filter,
  Download,
  X
} from 'lucide-react';
import ExportButton from '../common/ExportButton';

const CalendarView = ({ 
  interventions = [], 
  users = [], 
  onInterventionClick,
  onCreateIntervention
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // ==========================================
  // 📅 GÉNÉRATION DES JOURS
  // ==========================================
  const displayDays = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate];
    }
    
    if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay() + 1); // Lundi
      
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        return day;
      });
    }
    
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
      
      const days = [];
      const totalCells = Math.ceil((lastDay.getDate() + startDay) / 7) * 7;
      
      for (let i = 0; i < totalCells; i++) {
        const day = new Date(year, month, i - startDay + 1);
        days.push(day);
      }
      
      return days;
    }
    
    return [];
  }, [currentDate, viewMode]);

  // ==========================================
  // 🔍 FILTRAGE DES INTERVENTIONS
  // ==========================================
  const filteredInterventions = useMemo(() => {
    return interventions.filter(intervention => {
      // Filtre technicien
      if (selectedTechnician !== 'all' && intervention.assignedTo !== selectedTechnician) {
        return false;
      }
      
      // Filtre statut
      if (selectedStatus !== 'all' && intervention.status !== selectedStatus) {
        return false;
      }
      
      // Filtre priorité
      if (selectedPriority !== 'all' && intervention.priority !== selectedPriority) {
        return false;
      }
      
      return true;
    });
  }, [interventions, selectedTechnician, selectedStatus, selectedPriority]);

  // ==========================================
  // 📊 INTERVENTIONS PAR JOUR
  // ==========================================
  const getInterventionsForDay = (day) => {
    return filteredInterventions.filter(intervention => {
      if (!intervention.createdAt) return false;
      
      const interventionDate = intervention.createdAt instanceof Date 
        ? intervention.createdAt 
        : new Date(intervention.createdAt);
      
      return interventionDate.getFullYear() === day.getFullYear() &&
             interventionDate.getMonth() === day.getMonth() &&
             interventionDate.getDate() === day.getDate();
    });
  };

  // ==========================================
  // 📊 STATISTIQUES QUOTIDIENNES
  // ==========================================
  const getDayStats = (day) => {
    const dayInterventions = getInterventionsForDay(day);
    return {
      total: dayInterventions.length,
      completed: dayInterventions.filter(i => i.status === 'completed').length,
      inProgress: dayInterventions.filter(i => i.status === 'inprogress').length,
      urgent: dayInterventions.filter(i => i.priority === 'urgent').length
    };
  };

  // ==========================================
  // 🎯 NAVIGATION
  // ==========================================
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // ==========================================
  // 🎨 HELPERS VISUELS
  // ==========================================
  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 border-l-gray-400 dark:bg-gray-700 dark:text-gray-200';
      case 'inprogress': return 'bg-blue-100 text-blue-800 border-l-blue-500 dark:bg-blue-900/30 dark:text-blue-200';
      case 'ordering': return 'bg-orange-100 text-orange-800 border-l-orange-500 dark:bg-orange-900/30 dark:text-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-l-green-500 dark:bg-green-900/30 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-l-red-500 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 border-l-gray-400 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityIndicator = (priority) => {
    switch (priority) {
      case 'urgent': return '🔥';
      case 'high': return '⚠️';
      case 'normal': return '📋';
      case 'low': return '📌';
      default: return '';
    }
  };

  const formatPeriod = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } else if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      return `Semaine du ${start.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'long' })} au ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  };

  // ==========================================
  // 🎨 RENDER
  // ==========================================
  return (
    <div className="space-y-6">
      
      {/* ========== EN-TÊTE ========== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <CalendarIcon size={28} />
            Planning des Interventions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {formatPeriod()}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Sélection vue */}
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-2 text-sm transition ${
                viewMode === 'day'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 text-sm border-l border-r border-gray-300 dark:border-gray-600 transition ${
                viewMode === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 text-sm transition ${
                viewMode === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Mois
            </button>
          </div>

          {/* Navigation */}
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
          >
            Aujourd'hui
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Export */}
          <ExportButton
            data={filteredInterventions}
            type="planning"
            filters={{ date: currentDate, viewMode }}
          />

          {/* Créer intervention */}
          <button
            onClick={onCreateIntervention}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nouvelle</span>
          </button>
        </div>
      </div>

      {/* ========== FILTRES ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-800 dark:text-white">Filtres</h3>
          {(selectedTechnician !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all') && (
            <button
              onClick={() => {
                setSelectedTechnician('all');
                setSelectedStatus('all');
                setSelectedPriority('all');
              }}
              className="ml-auto text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <X size={14} />
              Réinitialiser
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Technicien */}
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les techniciens</option>
            {users.filter(u => u.role === 'technician').map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>

          {/* Statut */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="inprogress">En cours</option>
            <option value="ordering">En commande</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>

          {/* Priorité */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Toutes les priorités</option>
            <option value="urgent">Urgent</option>
            <option value="high">Haute</option>
            <option value="normal">Normale</option>
            <option value="low">Basse</option>
          </select>
        </div>
      </div>

      {/* ========== CALENDRIER ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {viewMode === 'week' && (
          <>
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {displayDays.map((day, index) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const stats = getDayStats(day);
                
                return (
                  <div
                    key={index}
                    className={`p-4 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                      isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-400 uppercase">
                      {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className={`text-2xl font-bold mt-1 ${
                      isToday 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-800 dark:text-white'
                    }`}>
                      {day.getDate()}
                    </div>
                    {stats.total > 0 && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{stats.total}</span>
                        {stats.urgent > 0 && <span className="text-red-600">🔥{stats.urgent}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Contenu des jours */}
            <div className="grid grid-cols-7">
              {displayDays.map((day, dayIndex) => {
                const dayInterventions = getInterventionsForDay(day);
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[400px] p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                      isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="space-y-2">
                      {dayInterventions.length > 0 ? (
                        dayInterventions.map((intervention) => (
                          <div
                            key={intervention.id}
                            onClick={() => onInterventionClick(intervention)}
                            className={`p-3 rounded-lg border-l-4 cursor-pointer transition hover:shadow-md ${getStatusColor(intervention.status)}`}
                          >
                            <div className="text-xs font-medium mb-1 truncate flex items-center gap-1">
                              <span>{getPriorityIndicator(intervention.priority)}</span>
                              <span>{intervention.location}</span>
                            </div>
                            <div className="text-xs truncate opacity-80">
                              {intervention.missionSummary}
                            </div>
                            {intervention.assignedToName && (
                              <div className="text-xs mt-1 opacity-70 truncate">
                                👤 {intervention.assignedToName}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 dark:text-gray-500 text-sm mt-8">
                          Aucune intervention
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'month' && (
          <>
            {/* En-têtes des jours de la semaine */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille du mois */}
            <div className="grid grid-cols-7">
              {displayDays.map((day, index) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const dayInterventions = getInterventionsForDay(day);
                const stats = getDayStats(day);

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-700 ${
                      !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900 opacity-50' : ''
                    } ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {day.getDate()}
                      {stats.total > 0 && (
                        <span className="ml-2 text-xs text-gray-500">({stats.total})</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayInterventions.slice(0, 3).map((intervention) => (
                        <div
                          key={intervention.id}
                          onClick={() => onInterventionClick(intervention)}
                          className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition truncate ${getStatusColor(intervention.status)}`}
                          title={intervention.missionSummary}
                        >
                          {getPriorityIndicator(intervention.priority)} {intervention.location}
                        </div>
                      ))}
                      {dayInterventions.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                          +{dayInterventions.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'day' && (
          <div className="p-6">
            {displayDays.map((day) => {
              const dayInterventions = getInterventionsForDay(day);
              
              return (
                <div key={day.toDateString()}>
                  {dayInterventions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                      Aucune intervention prévue ce jour
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayInterventions.map((intervention) => (
                        <div
                          key={intervention.id}
                          onClick={() => onInterventionClick(intervention)}
                          className={`p-4 rounded-lg border-l-4 cursor-pointer transition hover:shadow-md ${getStatusColor(intervention.status)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{getPriorityIndicator(intervention.priority)}</span>
                                <h4 className="font-semibold">{intervention.location}</h4>
                              </div>
                              <p className="text-sm opacity-90">{intervention.missionSummary}</p>
                            </div>
                          </div>
                          {intervention.assignedToName && (
                            <div className="text-sm mt-2 opacity-70">
                              👤 Assigné à: {intervention.assignedToName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== LÉGENDE ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Légende
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-l-4 border-gray-400 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">À faire</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border-l-4 border-orange-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">En commande</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-l-4 border-green-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Terminée</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Urgent</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;