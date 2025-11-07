'use client'

import { useState, useEffect, useRef } from 'react'
import { ConnectionStatus } from './ConnectionStatus'

export default function DisplayBoard({ initialData }: { initialData: any }) {
  const [panes, setPanes] = useState(initialData?.panes || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (panes.length > 0) {
      startRotation()
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, panes])

  const loadData = async () => {
    try {
      const res = await fetch('/api/messages')
      const data = await res.json()
      setPanes(data.panes || [])
    } catch (error) {
      console.error('Failed to load panes')
    }
  }

  const startRotation = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (panes.length === 0) return
    
    const duration = (panes[currentIndex]?.duration || 10) * 1000
    timerRef.current = setTimeout(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % panes.length)
        setIsTransitioning(false)
      }, 500)
    }, duration)
  }

  if (panes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full aspect-[9/16] text-white">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4">No messages to display</h1>
          <p className="text-xl opacity-80">Please add messages in the admin panel</p>
        </div>
      </div>
    )
  }

  const currentPane = panes[currentIndex]
  const backgroundStyle = currentPane?.background?.type === 'image'
    ? { backgroundImage: `url(${currentPane.background.value})` }
    : { backgroundColor: currentPane?.background?.value || '#ffffff' }

  return (
    // This is the 9:16 container
    <div className="relative h-full aspect-[9/16] overflow-hidden rounded-lg">
      <ConnectionStatus />
      
      <div 
        // This container fades and stacks content vertically
        className={`absolute inset-0 transition-opacity duration-1000 flex flex-col ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={backgroundStyle}
      >
        {currentPane?.title && (
          <div className="bg-black/70 backdrop-blur-sm p-8 text-center">
            <h1 className="text-4xl font-bold text-white">{currentPane.title}</h1>
          </div>
        )}
        
        {/* This container takes the remaining space and provides padding */}
        <div className="flex-1 min-h-0 p-8">
          {/* This inner box provides the styling.
              It's now a flex container and hides overflow.
           */}
          <div 
            className="bg-white/95 backdrop-blur rounded-xl shadow-2xl h-full flex flex-col overflow-hidden ql-snow"
          >
            {/* Content viewport - fully responsive, never exceeds viewport */}
            <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
              <div className="w-full max-w-full">
                {/* 2. USE .ql-editor to match the editor's styles */}
                <div
                  className="ql-editor"
                  dangerouslySetInnerHTML={{ __html: currentPane?.content?.html || '' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {panes.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {panes.map((_, index) => (
            <div 
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}