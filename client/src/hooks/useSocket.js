import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { useQueryClient } from '@tanstack/react-query';

let socketInstance = null;

export function useSocket() {
  const { token, user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) return;

    // Create singleton socket
    if (!socketInstance) {
      socketInstance = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    const socket = socketInstance;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setIsConnected(false);
    });

    // ── Expense events ──
    socket.on('expense:added', ({ expense }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Show toast only if it's someone else's action
      if (expense.paidBy?._id !== user._id) {
        addToast(
          `${expense.paidBy?.name} added "${expense.description}"`,
          'info'
        );
      }
    });

    socket.on('expense:updated', ({ expense }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('expense:deleted', ({ expenseId }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    // ── Balance events ──
    socket.on('balance:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    });

    // ── Settlement events ──
    socket.on('settlement:paid', ({ settlement }) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      addToast(`Settlement marked as paid!`, 'success');
    });

    // ── Member events ──
    socket.on('member:joined', ({ member }) => {
      queryClient.invalidateQueries({ queryKey: ['household'] });
      addToast(`${member.name} joined the household!`, 'success');
    });

    socket.on('member:removed', ({ memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['household'] });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('expense:added');
      socket.off('expense:updated');
      socket.off('expense:deleted');
      socket.off('balance:updated');
      socket.off('settlement:paid');
      socket.off('member:joined');
      socket.off('member:removed');
    };
  }, [token, user, queryClient, addToast]);

  return { isConnected, socket: socketInstance };
}

// Call this on logout to destroy socket
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
