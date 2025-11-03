// src/services/exportService.js

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Service d'export complet avec support PDF et Excel
 */
class ExportService {
  
  /**
   * Exporter les interventions en PDF
   */
  async exportToPDF(interventions, options = {}) {
    const {
      title = 'Rapport d\'interventions',
      includePhotos = false,
      includeHistory = false,
      includeStats = true,
      filters = {}
    } = options;

    try {
      const doc = new jsPDF('landscape');
      let yPosition = 20;

      // En-tête
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 15, yPosition);
      yPosition += 10;

      // Date de génération
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 15, yPosition);
      yPosition += 5;

      // Filtres appliqués
      if (Object.keys(filters).length > 0) {
        doc.text('Filtres appliqués:', 15, yPosition);
        yPosition += 5;
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            doc.text(`• ${this.getFilterLabel(key)}: ${value}`, 20, yPosition);
            yPosition += 5;
          }
        });
        yPosition += 5;
      }

      // Statistiques
      if (includeStats) {
        const stats = this.calculateStats(interventions);
        yPosition += 5;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistiques', 15, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const statsData = [
          ['Total interventions', stats.total],
          ['À faire', stats.todo],
          ['En cours', stats.inProgress],
          ['Terminées', stats.completed],
          ['Taux de complétion', `${stats.completionRate}%`],
          ['Temps moyen', `${stats.averageTime} min`]
        ];
        
        doc.autoTable({
          startY: yPosition,
          head: [['Métrique', 'Valeur']],
          body: statsData,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          margin: { left: 15 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Table des interventions
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      
      // Nouvelle page si nécessaire
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text('Liste des interventions', 15, yPosition);
      yPosition += 8;

      const tableData = interventions.map(intervention => [
        intervention.id?.substring(0, 8) || '',
        format(new Date(intervention.createdAt), 'dd/MM/yyyy', { locale: fr }),
        intervention.missionSummary || '',
        intervention.rooms?.join(', ') || '',
        this.getStatusLabel(intervention.status),
        this.getPriorityLabel(intervention.priority),
        intervention.assignedToName || 'Non assigné',
        intervention.completedAt 
          ? format(new Date(intervention.completedAt), 'dd/MM/yyyy', { locale: fr })
          : '-'
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [[
          'ID',
          'Date',
          'Mission',
          'Localisation',
          'Statut',
          'Priorité',
          'Assigné à',
          'Terminé le'
        ]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 60 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 35 },
          7: { cellWidth: 25 }
        },
        margin: { left: 15 }
      });

      // Détails par intervention (si demandé)
      if (includeHistory || includePhotos) {
        for (const intervention of interventions) {
          doc.addPage();
          yPosition = 20;

          // Titre de l'intervention
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(intervention.missionSummary, 15, yPosition);
          yPosition += 10;

          // Détails
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          
          const details = [
            ['ID', intervention.id],
            ['Statut', this.getStatusLabel(intervention.status)],
            ['Priorité', this.getPriorityLabel(intervention.priority)],
            ['Localisation', intervention.rooms?.join(', ') || ''],
            ['Créé le', format(new Date(intervention.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })],
            ['Créé par', intervention.createdByName],
            ['Assigné à', intervention.assignedToName || 'Non assigné']
          ];

          if (intervention.completedAt) {
            details.push(['Terminé le', format(new Date(intervention.completedAt), 'dd/MM/yyyy HH:mm', { locale: fr })]);
          }

          doc.autoTable({
            startY: yPosition,
            body: details,
            theme: 'plain',
            styles: { fontSize: 9 },
            columnStyles: {
              0: { cellWidth: 50, fontStyle: 'bold' },
              1: { cellWidth: 150 }
            },
            margin: { left: 15 }
          });

          yPosition = doc.lastAutoTable.finalY + 10;

          // Description
          if (intervention.description) {
            doc.setFont('helvetica', 'bold');
            doc.text('Description:', 15, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            const splitDesc = doc.splitTextToSize(intervention.description, 260);
            doc.text(splitDesc, 15, yPosition);
            yPosition += (splitDesc.length * 5) + 10;
          }

          // Historique
          if (includeHistory && intervention.history?.length > 0) {
            if (yPosition > 180) {
              doc.addPage();
              yPosition = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.text('Historique:', 15, yPosition);
            yPosition += 8;

            const historyData = intervention.history.map(entry => [
              format(new Date(entry.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
              entry.byName,
              this.getStatusLabel(entry.status) || '',
              entry.comment || ''
            ]);

            doc.autoTable({
              startY: yPosition,
              head: [['Date', 'Par', 'Statut', 'Commentaire']],
              body: historyData,
              theme: 'grid',
              styles: { fontSize: 8 },
              columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 50 },
                2: { cellWidth: 30 },
                3: { cellWidth: 125 }
              },
              margin: { left: 15 }
            });

            yPosition = doc.lastAutoTable.finalY + 10;
          }

          // Photos
          if (includePhotos && intervention.photos?.length > 0) {
            if (yPosition > 180) {
              doc.addPage();
              yPosition = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.text(`Photos (${intervention.photos.length}):`, 15, yPosition);
            yPosition += 8;

            // Note: L'ajout d'images nécessite que les URLs soient accessibles
            // et converties en base64. C'est complexe pour un export côté client.
            doc.setFont('helvetica', 'normal');
            doc.text('Les photos sont disponibles dans l\'application web.', 15, yPosition);
            yPosition += 5;

            intervention.photos.forEach((photo, index) => {
              doc.text(`${index + 1}. ${photo.caption || 'Photo'} - ${format(new Date(photo.uploadedAt), 'dd/MM/yyyy', { locale: fr })}`, 20, yPosition);
              yPosition += 5;
            });
          }
        }
      }

      // Pied de page sur chaque page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${i} sur ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        doc.text(
          'GestiHôtel - Gestion d\'interventions',
          15,
          doc.internal.pageSize.height - 10
        );
      }

      // Sauvegarder
      const filename = `interventions_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
      doc.save(filename);

      return { success: true, filename };
    } catch (error) {
      console.error('Erreur export PDF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporter en Excel
   */
  async exportToExcel(interventions, options = {}) {
    const {
      title = 'Interventions',
      includeStats = true,
      includeHistory = false
    } = options;

    try {
      const workbook = XLSX.utils.book_new();

      // Feuille principale
      const mainData = interventions.map(intervention => ({
        'ID': intervention.id?.substring(0, 8) || '',
        'Date création': format(new Date(intervention.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }),
        'Mission': intervention.missionSummary || '',
        'Description': intervention.description || '',
        'Type mission': intervention.missionType || '',
        'Type intervention': intervention.interventionType || '',
        'Localisation': intervention.rooms?.join(', ') || '',
        'Étage': intervention.floor || '',
        'Bâtiment': intervention.building || '',
        'Statut': this.getStatusLabel(intervention.status),
        'Priorité': this.getPriorityLabel(intervention.priority),
        'Créé par': intervention.createdByName || '',
        'Assigné à': intervention.assignedToName || 'Non assigné',
        'Date début': intervention.startedAt 
          ? format(new Date(intervention.startedAt), 'dd/MM/yyyy HH:mm', { locale: fr })
          : '',
        'Date fin': intervention.completedAt 
          ? format(new Date(intervention.completedAt), 'dd/MM/yyyy HH:mm', { locale: fr })
          : '',
        'Durée (min)': intervention.actualDuration || '',
        'Coût': intervention.cost || '',
        'Note': intervention.rating || '',
        'Photos': intervention.photos?.length || 0,
        'Messages': intervention.messages?.length || 0
      }));

      const mainSheet = XLSX.utils.json_to_sheet(mainData);
      
      // Largeur des colonnes
      mainSheet['!cols'] = [
        { wch: 10 }, // ID
        { wch: 18 }, // Date création
        { wch: 40 }, // Mission
        { wch: 50 }, // Description
        { wch: 20 }, // Type mission
        { wch: 20 }, // Type intervention
        { wch: 20 }, // Localisation
        { wch: 10 }, // Étage
        { wch: 15 }, // Bâtiment
        { wch: 15 }, // Statut
        { wch: 12 }, // Priorité
        { wch: 20 }, // Créé par
        { wch: 20 }, // Assigné à
        { wch: 18 }, // Date début
        { wch: 18 }, // Date fin
        { wch: 12 }, // Durée
        { wch: 10 }, // Coût
        { wch: 8 },  // Note
        { wch: 8 },  // Photos
        { wch: 10 }  // Messages
      ];

      XLSX.utils.book_append_sheet(workbook, mainSheet, 'Interventions');

      // Feuille de statistiques
      if (includeStats) {
        const stats = this.calculateStats(interventions);
        
        const statsData = [
          { 'Métrique': 'Total interventions', 'Valeur': stats.total },
          { 'Métrique': 'À faire', 'Valeur': stats.todo },
          { 'Métrique': 'En cours', 'Valeur': stats.inProgress },
          { 'Métrique': 'Terminées', 'Valeur': stats.completed },
          { 'Métrique': 'Annulées', 'Valeur': stats.cancelled },
          { 'Métrique': 'Taux de complétion', 'Valeur': `${stats.completionRate}%` },
          { 'Métrique': 'Temps moyen (min)', 'Valeur': stats.averageTime },
          { 'Métrique': '', 'Valeur': '' },
          { 'Métrique': 'Par priorité:', 'Valeur': '' },
          { 'Métrique': '  • Urgent', 'Valeur': stats.byPriority.urgent },
          { 'Métrique': '  • Haute', 'Valeur': stats.byPriority.high },
          { 'Métrique': '  • Normale', 'Valeur': stats.byPriority.normal },
          { 'Métrique': '  • Basse', 'Valeur': stats.byPriority.low }
        ];

        const statsSheet = XLSX.utils.json_to_sheet(statsData);
        statsSheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
        
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques');
      }

      // Feuille d'historique (optionnelle)
      if (includeHistory) {
        const historyData = [];
        
        interventions.forEach(intervention => {
          if (intervention.history?.length > 0) {
            intervention.history.forEach(entry => {
              historyData.push({
                'ID Intervention': intervention.id?.substring(0, 8) || '',
                'Mission': intervention.missionSummary,
                'Date': format(new Date(entry.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
                'Utilisateur': entry.byName,
                'Action': entry.type || 'Modification',
                'Statut': this.getStatusLabel(entry.status) || '',
                'Commentaire': entry.comment || '',
                'Champs modifiés': entry.fields?.map(f => f.field).join(', ') || ''
              });
            });
          }
        });

        if (historyData.length > 0) {
          const historySheet = XLSX.utils.json_to_sheet(historyData);
          historySheet['!cols'] = [
            { wch: 12 },
            { wch: 30 },
            { wch: 18 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
            { wch: 40 },
            { wch: 30 }
          ];
          
          XLSX.utils.book_append_sheet(workbook, historySheet, 'Historique');
        }
      }

      // Sauvegarder
      const filename = `${title}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      XLSX.writeFile(workbook, filename);

      return { success: true, filename };
    } catch (error) {
      console.error('Erreur export Excel:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporter en CSV
   */
  async exportToCSV(interventions, options = {}) {
    const {
      title = 'interventions',
      separator = ','
    } = options;

    try {
      const data = interventions.map(intervention => ({
        'ID': intervention.id || '',
        'Date': format(new Date(intervention.createdAt), 'yyyy-MM-dd HH:mm', { locale: fr }),
        'Mission': intervention.missionSummary || '',
        'Description': intervention.description || '',
        'Localisation': intervention.rooms?.join(';') || '',
        'Statut': intervention.status || '',
        'Priorité': intervention.priority || '',
        'Assigné': intervention.assignedToName || '',
        'Créé par': intervention.createdByName || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: separator });

      // Télécharger
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${title}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error('Erreur export CSV:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporter en JSON
   */
  async exportToJSON(interventions, options = {}) {
    const { title = 'interventions', pretty = true } = options;

    try {
      const jsonStr = pretty 
        ? JSON.stringify(interventions, null, 2)
        : JSON.stringify(interventions);

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${title}_${format(new Date(), 'yyyy-MM-dd')}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error('Erreur export JSON:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculer les statistiques
   */
  calculateStats(interventions) {
    const total = interventions.length;
    const todo = interventions.filter(i => i.status === 'todo').length;
    const inProgress = interventions.filter(i => i.status === 'inprogress').length;
    const completed = interventions.filter(i => i.status === 'completed').length;
    const cancelled = interventions.filter(i => i.status === 'cancelled').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const durations = interventions
      .filter(i => i.actualDuration)
      .map(i => i.actualDuration);
    const averageTime = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const byPriority = {
      urgent: interventions.filter(i => i.priority === 'urgent').length,
      high: interventions.filter(i => i.priority === 'high').length,
      normal: interventions.filter(i => i.priority === 'normal').length,
      low: interventions.filter(i => i.priority === 'low').length
    };

    return {
      total,
      todo,
      inProgress,
      completed,
      cancelled,
      completionRate,
      averageTime,
      byPriority
    };
  }

  /**
   * Utilitaires de labels
   */
  getStatusLabel(status) {
    const labels = {
      'todo': 'À faire',
      'inprogress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée',
      'onhold': 'En attente'
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority) {
    const labels = {
      'urgent': 'Urgent',
      'high': 'Haute',
      'normal': 'Normale',
      'low': 'Basse'
    };
    return labels[priority] || priority;
  }

  getFilterLabel(key) {
    const labels = {
      status: 'Statut',
      priority: 'Priorité',
      assignedTo: 'Assigné à',
      roomType: 'Type de localisation',
      dateRange: 'Période'
    };
    return labels[key] || key;
  }
}

export const exportService = new ExportService();
export default exportService;