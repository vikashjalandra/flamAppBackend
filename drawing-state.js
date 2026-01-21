export default class DrawingState {
  constructor() {
    this.operations = [];
    this.undoStack = [];
    this.maxHistorySize = 10000;
  }

  addOperation(operation) {
    this.undoStack = [];
    
    this.operations.push(operation);
    
    if (this.operations.length > this.maxHistorySize) {
      this.operations.shift();
    }
    
    return operation;
  }

  undo() {
    if (this.operations.length === 0) {
      return null;
    }
    
    const operation = this.operations.pop();
    this.undoStack.push(operation);
    
    return operation;
  }

  redo() {
    if (this.undoStack.length === 0) {
      return null;
    }
    
    const operation = this.undoStack.pop();
    this.operations.push(operation);
    
    return operation;
  }

  clear() {
    this.operations = [];
    this.undoStack = [];
  }

  getState() {
    return {
      operations: [...this.operations],
      canUndo: this.operations.length > 0,
      canRedo: this.undoStack.length > 0,
      operationCount: this.operations.length
    };
  }
}
