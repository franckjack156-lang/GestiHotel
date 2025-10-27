
import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Clock,
  DollarSign,
  FileText,
  Settings
} from 'lucide-react';

const AdvancedAnalytics = ({ interventions = [], users = [] }) => {
  const [dateRange, setDateRange] = useState('month'); // week, month, quarter, year
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [exportFormat, setExportFormat] = useState('pdf'); // pdf, excel, csv

  // ✅ Filtrer les interventions selon la période
  const filteredInterventions = useMemo(() => {
    const now = new Date();
    const filtered = interventions.filter(i => {
      if (!i.createdAt) return false;
      
      const createdDate = i.createdAt instanceof Date ? i.createdAt : new Date(i.createdAt);
      const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

      switch (dateRange) {
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        case 'quarter': return diffDays <= 90;
        case 'year': return diffDays <= 365;
        default: return true;
      }
    });

    if (selectedTechnician !== 'all') {
      return filtered.filter(i => i.assignedTo === selectedTechnician);
    }

    return filtered;
  }, [interventions, dateRange, selectedTechnician]);

  // ✅ Statistiques globales
  const globalStats = useMemo(() => {
    const total = filteredInterventions.length;
    const completed = filteredInterventions.filter(i => i.status === 'completed').length;
    const inProgress = filteredInterventions.filter(i => i.status === 'inprogress').length;
    const pending = filteredInterventions.filter(i => i.status === 'todo').length;
    const avgDuration = filteredInterventions
      .filter(i => i.actualDuration > 0)
      .reduce((sum, i) => sum + i.actualDuration, 0) / 
      filteredInterventions.filter(i => i.actualDuration > 0).length || 0;

    const completionRate = total > 0 ? (completed / total * 100).toFixed(1) : 0;

    // Calcul des tendances
    const previousPeriodInterventions = interventions.filter(i => {
      if (!i.createdAt) return false;
      const createdDate = i.createdAt instanceof Date ? i.createdAt : new Date(i.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

      switch (dateRange) {
        case 'week': return diffDays > 7 && diffDays <= 14;
        case 'month': return diffDays > 30 && diffDays <= 60;
        case 'quarter': return diffDays > 90 && diffDays <= 180;
        case 'year': return diffDays > 365 && diffDays <= 730;
        default: return false;
      }
    });

    const trend = total > previousPeriodInterventions.length 
      ? ((total - previousPeriodInterventions.length) / previousPeriodInterventions.length * 100).toFixed(1)
      : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      avgDuration: avgDuration.toFixed(1),
      completionRate,
      trend: isNaN(trend) ? 0 : trend
    };
  }, [filteredInterventions, interventions, dateRange]);

  // ✅ Données pour le graphique des interventions par jour
  const interventionsByDay = useMemo(() => {
    const days = {};
    
    filteredInterventions.forEach(i => {
      const date = i.createdAt instanceof Date ? i.createdAt : new Date(i.createdAt);
      const dayKey = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      
      if (!days[dayKey]) {
        days[dayKey] = { date: dayKey, total: 0, completed: 0, pending: 0 };
      }
      
      days[dayKey].total++;
      if (i.status === 'completed') days[dayKey].completed++;
      if (i.status === 'todo') days[dayKey].pending++;
    });

    return Object.values(days).slice(-14); // 14 derniers jours
  }, [filteredInterventions]);

  // ✅ Données pour le graphique par type
  const interventionsByType = useMemo(() => {
    const types = {};
    
    filteredInterventions.forEach(i => {
      const type = i.missionType || 'Non spécifié';
      types[type] = (types[type] || 0) + 1;
    });

    return Object.entries(types)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredInterventions]);

  // ✅ Données pour le graphique par priorité
  const interventionsByPriority = useMemo(() => {
    const priorities = {
      urgent: { name: 'Urgent', value: 0, color: '#ef4444' },
      high: { name: 'Haute', value: 0, color: '#f97316' },
      normal: { name: 'Normale', value: 0, color: '#3b82f6' },
      low: { name: 'Basse', value: 0, color: '#10b981' }
    };

    filteredInterventions.forEach(i => {
      const priority = i.priority || 'normal';
      if (priorities[priority]) {
        priorities[priority].value++;
      }
    });

    return Object.values(priorities);
  }, [filteredInterventions]);

  // ✅ Performance des techniciens
  const technicianPerformance = useMemo(() => {
    const performance = {};

    filteredInterventions.forEach(i => {
      const techId = i.assignedTo;
      const techName = i.assignedToName || 'Non assigné';

      if (!performance[techId]) {
        performance[techId] = {
          name: techName,
          total: 0,
          completed: 0,
          avgDuration: 0,
          durations: []
        };
      }

      performance[techId].total++;
      if (i.status === 'completed') {
        performance[techId].completed++;
        if (i.actualDuration > 0) {
          performance[techId].durations.push(i.actualDuration);
        }
      }
    });

    return Object.values(performance)
      .map(tech => ({
        ...tech,
        completionRate: tech.total > 0 ? (tech.completed / tech.total * 100).toFixed(1) : 0,
        avgDuration: tech.durations.length > 0 
          ? (tech.durations.reduce((a, b) => a + b, 0) / tech.durations.length).toFixed(1)
          : 0
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);
  }, [filteredInterventions]);

  // ✅ Chambres les plus problématiques
  const topProblematicRooms = useMemo(() => {
    const rooms = {};

    filteredInterventions.forEach(i => {
      const room = i.location || 'Non spécifié';
      rooms[room] = (rooms[room] || 0) + 1;
    });

    return Object.entries(rooms)
      .map(([room, count]) => ({ room, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredInterventions]);

  // ✅ Export des données
  const handleExport = () => {
    const data = {
      period: dateRange,
      generatedAt: new Date().toISOString(),
      stats: globalStats,
      interventions: filteredInterventions,
      technicianPerformance,
      topProblematicRooms
    };

    if (exportFormat === 'csv') {
      exportToCSV(data);
    } else if (exportFormat === 'excel') {
      exportToExcel(data);
    } else {
      exportToPDF(data);
    }
  };

  const exportToCSV = (data) => {
    let csv = 'Type,Nom,Valeur\n';
    
    // Stats globales
    csv += `Total,Interventions,${data.stats.total}\n`;
    csv += `Completed,Terminées,${data.stats.completed}\n`;
    csv += `InProgress,En cours,${data.stats.inProgress}\n`;
    csv += `Pending,En attente,${data.stats.pending}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${Date.now()}.csv`;
    a.click();
  };

  const exportToExcel = (data) => {
    console.log('Export Excel pas encore implémenté');
    alert('Export Excel sera disponible prochainement');
  };

  const exportToPDF = (data) => {
    console.log('Export PDF pas encore implémenté');
    alert('Export PDF sera disponible prochainement');
  };

  const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Analytics Avancés
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyse détaillée des performances et tendances
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="quarter">3 derniers mois</option>
            <option value="year">12 derniers mois</option>
          </select>

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

          <div className="flex gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button
              onClick={handleExport}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Download size={20} />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Total</span>
            <FileText size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{globalStats.total}</p>
          <div className="flex items-center gap-1 mt-2 text-sm">
            {globalStats.trend >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span>{Math.abs(globalStats.trend)}% vs période précédente</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Terminées</span>
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{globalStats.completed}</p>
          <p className="text-sm opacity-90 mt-2">
            Taux: {globalStats.completionRate}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">En cours</span>
            <Clock size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{globalStats.inProgress}</p>
          <p className="text-sm opacity-90 mt-2">
            {((globalStats.inProgress / globalStats.total) * 100).toFixed(1)}% du total
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">En attente</span>
            <Calendar size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{globalStats.pending}</p>
          <p className="text-sm opacity-90 mt-2">
            À traiter
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Durée moy.</span>
            <Clock size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{globalStats.avgDuration}h</p>
          <p className="text-sm opacity-90 mt-2">
            Par intervention
          </p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution temporelle */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Évolution des interventions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={interventionsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Terminées" />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="En attente" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par type */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Interventions par type
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={interventionsByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="value" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par priorité */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Répartition par priorité
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={interventionsByPriority}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {interventionsByPriority.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance techniciens */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Top 5 Techniciens
          </h3>
          <div className="space-y-4">
            {technicianPerformance.map((tech, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800 dark:text-white">
                      {tech.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tech.completed}/{tech.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${tech.completionRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{tech.completionRate}% réussite</span>
                    <span>{tech.avgDuration}h moy.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chambres problématiques */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Top 10 Chambres les plus problématiques
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {topProblematicRooms.map((room, index) => (
            <div 
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-red-500"
            >
              <div className="font-bold text-gray-800 dark:text-white mb-1">
                {room.room}
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {room.count}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                interventions
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;