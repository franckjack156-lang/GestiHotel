import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBlockedRooms } from '../useFirestore';
import { onSnapshot } from 'firebase/firestore';

describe('useBlockedRooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return blocked rooms', async () => {
    const mockBlockedRooms = [
      {
        id: '1',
        room: '101',
        blocked: true,
        reason: 'Maintenance',
        blockedAt: { toDate: () => new Date('2024-01-01') },
        blockedBy: 'user-1',
        blockedByName: 'John Doe'
      },
      {
        id: '2',
        room: '102',
        blocked: true,
        reason: 'Rénovation',
        blockedAt: { toDate: () => new Date('2024-01-02') },
        blockedBy: 'user-2',
        blockedByName: 'Jane Smith'
      }
    ];

    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({
        docs: mockBlockedRooms.map(room => ({
          id: room.id,
          data: () => room
        }))
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useBlockedRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0]).toHaveProperty('room', '101');
    expect(result.current.data[0]).toHaveProperty('blocked', true);
  });

  it('should transform dates correctly', async () => {
    const mockRoom = {
      id: '1',
      room: '101',
      blocked: true,
      blockedAt: { toDate: () => new Date('2024-01-01') },
      unblockedAt: null
    };

    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({
        docs: [{
          id: mockRoom.id,
          data: () => mockRoom
        }]
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useBlockedRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data[0].blockedAt).toBeInstanceOf(Date);
    expect(result.current.data[0].unblockedAt).toBe(null);
  });

  it('should only return currently blocked rooms', async () => {
    const mockRooms = [
      { id: '1', room: '101', blocked: true, blockedAt: { toDate: () => new Date() } },
      { id: '2', room: '102', blocked: false, blockedAt: { toDate: () => new Date() } }
    ];

    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      // Le hook filtre déjà avec [['blocked', '==', true]]
      callback({
        docs: mockRooms
          .filter(r => r.blocked)
          .map(room => ({
            id: room.id,
            data: () => room
          }))
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useBlockedRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].room).toBe('101');
  });

  it('should order by blockedAt descending', async () => {
    const mockRooms = [
      {
        id: '1',
        room: '101',
        blocked: true,
        blockedAt: { toDate: () => new Date('2024-01-01') }
      },
      {
        id: '2',
        room: '102',
        blocked: true,
        blockedAt: { toDate: () => new Date('2024-01-03') }
      },
      {
        id: '3',
        room: '103',
        blocked: true,
        blockedAt: { toDate: () => new Date('2024-01-02') }
      }
    ];

    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      // Simuler l'ordre descendant
      const sorted = [...mockRooms].sort((a, b) => 
        b.blockedAt.toDate().getTime() - a.blockedAt.toDate().getTime()
      );
      
      callback({
        docs: sorted.map(room => ({
          id: room.id,
          data: () => room
        }))
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useBlockedRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data[0].room).toBe('102'); // Plus récent
    expect(result.current.data[1].room).toBe('103');
    expect(result.current.data[2].room).toBe('101'); // Plus ancien
  });

  it('should handle empty blocked rooms', async () => {
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    const { result } = renderHook(() => useBlockedRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should handle Firestore errors', async () => {
    const mockError = new Error('Permission denied');

    vi.mocked(onSnapshot).mockImplementation((query, callback, errorCallback) => {
      errorCallback(mockError);
      return vi.fn();
    });

    const { result } = renderHook(() => useBlockedRooms());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('should update in realtime', async () => {
    const unsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockReturnValue(unsubscribe);

    const { result, unmount } = renderHook(() => useBlockedRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});