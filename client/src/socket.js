import { io } from 'socket.io-client';

const SOCKET_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
    });
  }
  return socket;
};
