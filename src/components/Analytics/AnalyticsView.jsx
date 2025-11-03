import React, { useState, useMemo } from 'react';
import { 
  BarChart, PieChart, TrendingUp, Calendar, 
  Clock, Users, MapPin, AlertCircle, Filter
} from 'lucide-react';
import ExportButton from '../common/ExportButton';

const AnalyticsView = ({ stats, interventions = [] }) => {
  const [dateRange, setDateRange] = useState('month');
  const [chartType, setChartType] = useState('bar');

  // ✅ Filtrer interventions par période
  const filteredInterventions = useMemo(() => {
    const now = new Date();
    return interventions.filter(i => {
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
  }, [interventions, dateRange]);

  const chartData = useMemo(() => {
    const baseData = {
      interventionsByStatus: [
        { status: 'À faire', count: stats.totalInterventions - stats.completedThisMonth, color: 'bg-gray-500' },
        { status: 'En cours', count: Math.floor(stats.totalInterventions * 0.3), color: 'bg-blue-500' },
        { status: 'Terminées', count: stats.completedThisMonth, color: 'bg-green-500' }
      ],
      interventionsByPriority: [
        { priority: 'Urgent', count: Math.floor(stats.totalInterventions * 0.2), color: 'bg-red-500' },
        { priority: 'Haute', count: Math.floor(stats.totalInterventions * 0.3), color: 'bg-orange-500' },
        { priority: 'Normale', count: Math.floor(stats.totalInterventions * 0.5), color: 'bg-blue-500' }
      ],
      monthlyTrend: [
        { month: 'Jan', interventions: 45, completed: 38 },
        { month: 'Fév', interventions: 52, completed: 45 },
        { month: 'Mar', interventions: 48, completed: 42 },
        { month: 'Avr', interventions: 67, completed: 58 },
        { month: 'Mai', interventions: 72, completed: 65 },
        { month: 'Jun', interventions: 85, completed: 72 }
      ]
    };
    return baseData;
  }, [stats]);

  const completionRate = stats.totalInterventions > 0 
    ? Math.round((stats.completedThisMonth / stats.totalInterventions) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* ✅ EN-TÊTE AVEC EXPORT */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Analytics & Rapports
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Statistiques et analyses des interventions
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>

          {/* ✅ BOUTON EXPORT */}
          <ExportButton
            data={filteredInterventions}
            type="analytics"
            filters={{ dateRange }}
            options={{
              title: `Rapport Analytics - ${dateRange === 'week' ? 'Semaine' : dateRange === 'month' ? 'Mois' : dateRange === 'quarter' ? 'Trimestre' : 'Année'}`,
              includeStats: true,
              includeHistory: true
            }}
          />
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total interventions</h3>
            <BarChart size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalInterventions}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            +12% vs mois dernier
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminées ce mois</h3>
            <Calendar size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.completedThisMonth}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Taux: {completionRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Temps moyen (h)</h3>
            <Clock size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.averageResolutionTime}</p>
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
            -15min vs moyenne
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de complétion</h3>
            <TrendingUp size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{completionRate}%</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            +8% vs cible
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des statuts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Interventions par statut
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-lg ${chartType === 'bar' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-400'}`}
              >
                <BarChart size={20} />
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`p-2 rounded-lg ${chartType === 'pie' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-400'}`}
              >
                <PieChart size={20} />
              </button>
            </div>
          </div>

          {chartType === 'bar' ? (
            <div className="space-y-4">
              {chartData.interventionsByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color} transition-all`}
                        style={{ 
                          width: `${(item.count / Math.max(...chartData.interventionsByStatus.map(i => i.count))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {stats.totalInterventions}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                  </div>
                </div>
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {chartData.interventionsByStatus.map((item, index) => {
                    const total = chartData.interventionsByStatus.reduce((sum, i) => sum + i.count, 0);
                    const percentage = (item.count / total) * 100;
                    const circumference = 2 * Math.PI * 40;
                    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                    
                    return (
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={item.color.replace('bg-', '')}
                        strokeWidth="8"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={index === 0 ? 0 : circumference - (chartData.interventionsByStatus.slice(0, index).reduce((sum, i) => sum + (i.count / total) * circumference, 0))}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Performance par technicien */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
            Performance par technicien
          </h3>
          {stats.technicianPerformance && stats.technicianPerformance.length > 0 ? (
            <div className="space-y-4">
              {stats.technicianPerformance.map((tech, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-800 dark:text-white">{tech.name}</p>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {Math.round(tech.completionRate)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${tech.completionRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{tech.completed} terminées</span>
                      <span>{tech.total} assignées</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune donnée de performance disponible
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendances mensuelles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
            Tendances mensuelles
          </h3>
          <div className="space-y-4">
            {chartData.monthlyTrend.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                  {month.month}
                </span>
                <div className="flex-1 mx-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${(month.completed / month.interventions) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
                      {month.completed}/{month.interventions}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400 w-12 text-right">
                  {Math.round((month.completed / month.interventions) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chambres les plus problématiques */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
            Chambres les plus problématiques
          </h3>
          {stats.roomIssueFrequency && stats.roomIssueFrequency.length > 0 ? (
            <div className="space-y-3">
              {stats.roomIssueFrequency.slice(0, 5).map((room, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-500" />
                    <span className="font-medium text-gray-800 dark:text-white">{room.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{room.count} interventions</span>
                    <div className={`w-3 h-3 rounded-full ${
                      room.count > 10 ? 'bg-red-500' :
                      room.count > 5 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune donnée de localisation disponible
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Métriques avancées */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
          Métriques avancées
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {Math.round(stats.averageResolutionTime * 60)}min
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Temps moyen
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completionRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Taux de réussite
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.floor(stats.totalInterventions / 30)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Moyenne/jour
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.technicianPerformance?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Techniciens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;