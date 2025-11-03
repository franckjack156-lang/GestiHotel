import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { exportService } from '../../services/exportService';
import { toast } from '../../utils/toast';

/**
 * Composant réutilisable pour exporter des données
 * Supporte PDF, Excel et CSV
 */
const ExportButton = ({ 
  data = [], 
  type = 'interventions',
  filters = {},
  options = {},
  className = '',
  variant = 'primary' // 'primary' | 'secondary'
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null);

  const handleExport = async (format) => {
    setExporting(true);
    setExportingFormat(format);
    setShowMenu(false);

    try {
      let result;
      const exportOptions = {
        ...options,
        filters,
        title: options.title || getDefaultTitle(type)
      };

      switch(format) {
        case 'pdf':
          result = await exportService.exportToPDF(data, exportOptions);
          break;
        case 'excel':
          result = await exportService.exportToExcel(data, exportOptions);
          break;
        case 'csv':
          result = await exportService.exportToCSV(data, exportOptions);
          break;
        default:
          throw new Error('Format non supporté');
      }

      if (result.success) {
        toast.success(`Export ${format.toUpperCase()} réussi !`, {
          description: result.filename ? `Fichier: ${result.filename}` : undefined
        });
      } else {
        throw new Error(result.error || 'Erreur lors de l\'export');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error(`Erreur export ${format.toUpperCase()}`, {
        description: error.message
      });
    } finally {
      setExporting(false);
      setExportingFormat(null);
    }
  };

  const getDefaultTitle = (type) => {
    const titles = {
      interventions: 'Interventions',
      dashboard: 'Tableau de bord',
      analytics: 'Analytics',
      rooms: 'Chambres',
      users: 'Utilisateurs'
    };
    return titles[type] || 'Export';
  };

  const buttonClasses = variant === 'primary'
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={exporting || data.length === 0}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${buttonClasses} ${className}
        `}
        title={data.length === 0 ? 'Aucune donnée à exporter' : 'Exporter les données'}
      >
        {exporting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Export {exportingFormat}...</span>
          </>
        ) : (
          <>
            <Download size={20} />
            <span>Exporter</span>
          </>
        )}
      </button>

      {/* Menu dropdown */}
      {showMenu && !exporting && (
        <>
          {/* Overlay pour fermer */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Format d'export
              </span>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Options */}
            <div className="py-2">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText size={20} className="text-red-500" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    PDF
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Document formaté
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FileSpreadsheet size={20} className="text-green-500" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Excel
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Tableau avec formules
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText size={20} className="text-blue-500" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    CSV
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Données brutes
                  </div>
                </div>
              </button>
            </div>

            {/* Footer info */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {data.length} élément{data.length > 1 ? 's' : ''} à exporter
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;