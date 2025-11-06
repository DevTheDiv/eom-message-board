'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'

export function ScaleControls({ scale, onScaleChange }: { scale: number, onScaleChange: (scale: number) => void }) {
  const [showControls, setShowControls] = useState(false)

  const handleScaleChange = (newScale: number) => {
    onScaleChange(newScale)
    localStorage.setItem('displayScale', newScale.toString())
  }

  return (
    <>
      <button
        onClick={() => setShowControls(!showControls)}
        className="fixed top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 hover:bg-white transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="font-medium">Scale: {scale}%</span>
      </button>

      {showControls && (
        <div className="fixed top-16 left-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-xl z-50">
          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={scale}
            onChange={(e) => handleScaleChange(parseInt(e.target.value))}
            className="w-48 mb-3"
          />
          <div className="grid grid-cols-4 gap-2">
            {[75, 100, 125, 150].map(preset => (
              <button
                key={preset}
                onClick={() => handleScaleChange(preset)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
