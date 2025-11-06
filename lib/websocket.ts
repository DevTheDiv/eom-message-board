// WebSocket utilities for real-time updates
// Note: In production, consider using Pusher, Ably, or Socket.io

export class WebSocketManager {
  private connections: Set<WebSocket> = new Set()

  addConnection(ws: WebSocket) {
    this.connections.add(ws)
    
    ws.on('close', () => {
      this.connections.delete(ws)
    })
  }

  broadcast(data: any) {
    const message = JSON.stringify(data)
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    })
  }

  getConnectionCount() {
    return this.connections.size
  }
}

export const wsManager = new WebSocketManager()
