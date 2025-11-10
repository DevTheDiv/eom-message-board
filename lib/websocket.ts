// WebSocket utilities for real-time updates
// Note: In production, consider using Pusher, Ably, or Socket.io

export class WebSocketManager {
  private connections: Set<any> = new Set()

  addConnection(ws: any) {
    this.connections.add(ws)

    ws.on('close', () => {
      this.connections.delete(ws)
    })
  }

  broadcast(data: any) {
    const message = JSON.stringify(data)
    this.connections.forEach((ws: any) => {
      if (ws.readyState === 1) { // 1 = OPEN
        ws.send(message)
      }
    })
  }

  getConnectionCount() {
    return this.connections.size
  }
}

export const wsManager = new WebSocketManager()
