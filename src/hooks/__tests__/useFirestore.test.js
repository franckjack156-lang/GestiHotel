import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useFirestore from '../useFirestore';
import { onSnapshot } from 'firebase/firestore';

describe('useFirestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => 
      useFirestore('interventions')
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should return data after loading', async () => {
    const mockData = [
      { id: '1', name: 'Test 1' },
      { id: '2', name: 'Test 2' }
    ];

    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({
        docs: mockData.map(item => ({
          id: item.id,
          data: () => item,
          exists: () => true
        }))
      });
      return vi.fn();
    });

    const { result } = renderHook(() => 
      useFirestore('interventions')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0]).toHaveProperty('id', '1');
  });

  it('should apply filters correctly', async () => {
    const { result } = renderHook(() => 
      useFirestore('interventions', {
        filters: [['status', '==', 'completed']]
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  it('should handle errors', async () => {
    const mockError = new Error('Firestore error');
    
    vi.mocked(onSnapshot).mockImplementation((query, callback, errorCallback) => {
      errorCallback(mockError);
      return vi.fn();
    });

    const { result } = renderHook(() => 
      useFirestore('interventions')
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.loading).toBe(false);
  });

  it('should transform data when transform function provided', async () => {
    const mockData = [{ id: '1', createdAt: { toDate: () => new Date('2024-01-01') } }];

    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({
        docs: mockData.map(item => ({
          id: item.id,
          data: () => item
        }))
      });
      return vi.fn();
    });

    const { result } = renderHook(() => 
      useFirestore('interventions', {
        transform: (item) => ({
          ...item,
          createdAt: item.createdAt?.toDate?.() || new Date()
        })
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data[0].createdAt).toBeInstanceOf(Date);
  });

  it('should cleanup on unmount', () => {
    const unsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => 
      useFirestore('interventions')
    );

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});