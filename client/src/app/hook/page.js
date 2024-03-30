// SocketProvider.js
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

// Create a context for the socket
const SocketContext = createContext(null);
// Custom hook to use the socket
export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

// SocketProvider component to establish connection and provide socket context
export const SocketProvider = (props) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Establish socket connection memoized to avoid unnecessary reconnections
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
    }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
