// src/components/Planning/CalendarView.jsx
import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Filter,
  Download,
  Plus
} from 'lucide-react';

const CalendarView = ({ 
  interventions = [], 
  users = [],
  onInterventionClick,
  onCreateIntervention,
  onDragDrop 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // day, week, month
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [draggedIntervention, setDraggedIntervention] = useState(null);

  // ✅ Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // ✅ Obtenir les jours du mois
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Jours du mois suivant
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentDate]);

  // ✅ Obtenir les interventions d'un jour
  const getInterventionsForDay = (date) => {
    return interventions.filter(intervention => {
      if (!intervention.createdAt) return false;
      
      const interventionDate = intervention.createdAt instanceof Date 
        ? intervention.createdAt 
        : new Date(intervention.createdAt);
      
      const isSameDay = 
        interventionDate.getDate() === date.getDate() &&
        interventionDate.getMonth() === date.getMonth() &&
        interventionDate.getFullYear() === date.getFullYear();

      if (selectedTechnician !== 'all') {
        return isSameDay && intervention.assignedTo === selectedTechnician;
      }

      return isSameDay;
    });
  };

  // ✅ Vérifier si c'est aujourd'hui
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // ✅ Couleur selon le statut
  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-400',
      inprogress: 'bg-blue-500',
      ordering: 'bg-orange-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || colors.todo;
  };

  // ✅ Drag & Drop
  const handleDragStart = (e, intervention) => {
    setDraggedIntervention(intervention);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    
    if (draggedIntervention && onDragDrop) {
      await onDragDrop(draggedIntervention.id, targetDate);
    }
    
    setDraggedIntervention(null);
  };

  // ✅ Titre du calendrier
  const getCalendarTitle = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-bold text-gray-800 dark:text-white min-w-[250px] text-center">
            {getCalendarTitle()}
          </h2>
          
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronRight size={20} />
          </button>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Aujourd'hui
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Mois
            </button>
          </div>

          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les techniciens</option>
            {users.filter(u => u.role === 'technician').map(tech => (
              <option key={tech.id} value={tech.id}>{tech.name}</option>
            ))}
          </select>

          <button
            onClick={onCreateIntervention}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <Plus size={20} />
            Nouvelle
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, index) => (
            <div
              key={index}
              className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7">
          {daysInMonth.map((day, index) => {
            const dayInterventions = getInterventionsForDay(day.date);
            const isCurrentDay = isToday(day.date);

            return (
              <div
                key={index}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.date)}
                className={`min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-gray-700 ${
                  !day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
                } ${isCurrentDay ? 'ring-2 ring-indigo-500 ring-inset' : ''} hover:bg-gray-50 dark:hover:bg-gray-700 transition`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  !day.isCurrentMonth 
                    ? 'text-gray-400 dark:text-gray-600' 
                    : isCurrentDay
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayInterventions.slice(0, 3).map((intervention) => (
                    <div
                      key={intervention.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, intervention)}
                      onClick={() => onInterventionClick(intervention)}
                      className={`p-1.5 rounded text-xs cursor-pointer hover:opacity-80 transition ${
                        getStatusColor(intervention.status)
                      } text-white truncate`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span className="truncate">{intervention.location}</span>
                      </div>
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
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-400"></div>
          <span className="text-gray-600 dark:text-gray-400">À faire</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">En cours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-gray-600 dark:text-gray-400">En commande</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Terminée</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;