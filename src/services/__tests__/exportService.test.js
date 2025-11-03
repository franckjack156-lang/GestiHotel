import { describe, it, expect, beforeEach } from 'vitest';
import { exportService } from '../../services/exportService';

describe('exportService', () => {
  beforeEach(() => {
    // Reset entre chaque test
  });

  describe('calculateStats', () => {
    it('should calculate correct statistics', () => {
      const mockInterventions = [
        { status: 'todo', priority: 'high' },
        { status: 'in-progress', priority: 'normal' },
        { status: 'completed', priority: 'high' },
        { status: 'completed', priority: 'low' },
        { status: 'todo', priority: 'urgent' }
      ];

      const stats = exportService.calculateStats(mockInterventions);

      expect(stats.total).toBe(5);
      expect(stats.todo).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(2);
      expect(stats.completionRate).toBe(40);
    });

    it('should handle empty array', () => {
      const stats = exportService.calculateStats([]);

      expect(stats.total).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct labels', () => {
      expect(exportService.getStatusLabel('todo')).toBe('À faire');
      expect(exportService.getStatusLabel('in-progress')).toBe('En cours');
      expect(exportService.getStatusLabel('completed')).toBe('Terminée');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return correct labels', () => {
      expect(exportService.getPriorityLabel('urgent')).toBe('Urgent');
      expect(exportService.getPriorityLabel('high')).toBe('Haute');
      expect(exportService.getPriorityLabel('normal')).toBe('Normale');
      expect(exportService.getPriorityLabel('low')).toBe('Basse');
    });
  });
});