import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import RoomManager from './rooms.js';

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const roomManager = new RoomManager();
const PORT = process.env.PORT || 4000;

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  let currentRoom = null;
  let userName = `User-${socket.id.substring(0, 6)}`;
  let userColor = null;

  socket.on('join-room', ({ roomId = 'main', name }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      roomManager.leaveRoom(currentRoom, socket.id);
    }

    if (name) {
      userName = name;
    }

    currentRoom = roomId;
    socket.join(roomId);
    
    const userInfo = roomManager.joinRoom(roomId, socket.id, userName);
    userColor = userInfo.color;

    const roomState = roomManager.getRoomState(roomId);
    socket.emit('canvas-state', {
      operations: roomState.operations,
      users: roomState.users
    });

    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName,
      color: userColor,
      timestamp: Date.now()
    });

    socket.emit('room-joined', {
      roomId,
      userId: socket.id,
      userName,
      color: userColor,
      users: roomState.users
    });
  });

  socket.on('draw', (data) => {
    if (!currentRoom) return;

    const operation = {
      ...data,
      userId: socket.id,
      userName,
      userColor,
      timestamp: Date.now(),
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };

    roomManager.addOperation(currentRoom, operation);
    socket.to(currentRoom).emit('draw', operation);
  });

  socket.on('cursor-move', (data) => {
    if (!currentRoom) return;

    socket.to(currentRoom).emit('cursor-move', {
      userId: socket.id,
      userName,
      color: userColor,
      ...data
    });
  });

  socket.on('undo', () => {
    if (!currentRoom) return;

    const undoneOp = roomManager.undo(currentRoom);
    
    if (undoneOp) {
      io.to(currentRoom).emit('undo', {
        operationId: undoneOp.id,
        timestamp: Date.now()
      });
    }
  });

  socket.on('redo', () => {
    if (!currentRoom) return;

    const redoneOp = roomManager.redo(currentRoom);
    
    if (redoneOp) {
      io.to(currentRoom).emit('redo', {
        operation: redoneOp,
        timestamp: Date.now()
      });
    }
  });

  socket.on('clear-canvas', () => {
    if (!currentRoom) return;

    roomManager.clearCanvas(currentRoom);
    
    io.to(currentRoom).emit('clear-canvas', {
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (currentRoom) {
      roomManager.leaveRoom(currentRoom, socket.id);
      
      socket.to(currentRoom).emit('user-left', {
        userId: socket.id,
        userName,
        timestamp: Date.now()
      });
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Collaborative Canvas Server running on port ${PORT}`);
});
