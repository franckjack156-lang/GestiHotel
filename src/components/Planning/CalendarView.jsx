// src/components/Planning/CalendarView.jsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';

const CalendarView = ({ 
  interventions = [], 
  users = [], 
  onInterventionClick,
  onCreateIntervention,
  onDragDrop 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'

  // Générer les jours de la semaine
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Lundi
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  }, [currentDate]);

  // Filtrer les interventions par jour
  const getInterventionsForDay = (day) => {
    return interventions.filter(intervention => {
      if (!intervention.createdAt) return false;
      
      // Convertir en Date si nécessaire
      const interventionDate = intervention.createdAt instanceof Date 
        ? intervention.createdAt 
        : new Date(intervention.createdAt);
      
      // Comparer uniquement année/mois/jour (ignorer l'heure)
      return interventionDate.getFullYear() === day.getFullYear() &&
             interventionDate.getMonth() === day.getMonth() &&
             interventionDate.getDate() === day.getDate();
    });
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'inprogress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ordering': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Planning des Interventions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
          >
            Aujourd'hui
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            onClick={onCreateIntervention}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nouvelle intervention</span>
          </button>
        </div>
      </div>

      {/* Calendrier semaine */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={index}
                className={`p-4 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                  isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className={`text-2xl font-bold mt-1 ${
                  isToday 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-800 dark:text-white'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contenu des jours */}
        <div className="grid grid-cols-7">
          {weekDays.map((day, dayIndex) => {
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
                        <div className="text-xs font-medium mb-1 truncate">
                          {intervention.location}
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
      </div>

      {/* Légende */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Légende
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">À faire</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">En commande</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Terminée</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;