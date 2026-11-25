import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export const useLiveSync = (onEventCallback) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('slotsync:liveUpdate', (payload) => {
      setLastEvent(payload);
      if (typeof onEventCallback === 'function') {
        onEventCallback(payload);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [onEventCallback]);

  return { isConnected, lastEvent };
};
