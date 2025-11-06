'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-white text-sm z-50 ${
      isConnected ? 'bg-green-500' : 'bg-red-500'
    }`}>
      <div className="flex items-center gap-2">
        {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span>{isConnected ? 'Connected' : 'Offline'}</span>
      </div>
    </div>
  )
}
