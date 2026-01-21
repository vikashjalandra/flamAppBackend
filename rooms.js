import DrawingState from './drawing-state.js';

export default class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.roomUsers = new Map();
    this.userInfo = new Map();
    this.userColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
      '#E63946', '#A8DADC', '#F77F00', '#06FFA5', '#FF006E'
    ];
  }

  getRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new DrawingState());
      this.roomUsers.set(roomId, new Set());
      this.userInfo.set(roomId, new Map());
    }
    
    return this.rooms.get(roomId);
  }

  getRoomState(roomId) {
    const room = this.getRoom(roomId);
    const users = this.getRoomUsers(roomId);
    
    return {
      ...room.getState(),
      users,
      userCount: users.length
    };
  }

  joinRoom(roomId, userId, userName) {
    const room = this.getRoom(roomId);
    const users = this.roomUsers.get(roomId);
    const userInfoMap = this.userInfo.get(roomId);
    
    const usedColors = Array.from(userInfoMap.values()).map(u => u.color);
    const availableColors = this.userColors.filter(c => !usedColors.includes(c));
    const color = availableColors.length > 0 
      ? availableColors[0] 
      : this.userColors[Math.floor(Math.random() * this.userColors.length)];
    
    const userInfo = {
      userId,
      userName,
      color,
      joinedAt: Date.now()
    };
    
    users.add(userId);
    userInfoMap.set(userId, userInfo);
    
    return userInfo;
  }

  leaveRoom(roomId, userId) {
    if (!this.roomUsers.has(roomId)) return;
    
    const users = this.roomUsers.get(roomId);
    const userInfoMap = this.userInfo.get(roomId);
    
    users.delete(userId);
    userInfoMap.delete(userId);
  }

  getRoomUsers(roomId) {
    if (!this.userInfo.has(roomId)) {
      return [];
    }
    
    return Array.from(this.userInfo.get(roomId).values());
  }

  addOperation(roomId, operation) {
    const room = this.getRoom(roomId);
    return room.addOperation(operation);
  }

  undo(roomId) {
    const room = this.getRoom(roomId);
    return room.undo();
  }

  redo(roomId) {
    const room = this.getRoom(roomId);
    return room.redo();
  }

  clearCanvas(roomId) {
    const room = this.getRoom(roomId);
    room.clear();
  }
}
