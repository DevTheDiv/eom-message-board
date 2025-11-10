'use client'

import { useState, useEffect, useRef } from 'react'
import { ConnectionStatus } from './ConnectionStatus'

// Fixed render dimensions - matches Preview.tsx (the "king")
const PORTRAIT_WIDTH = 1080
const PORTRAIT_HEIGHT = 1920

export default function DisplayBoard({ initialData }: { initialData: any }) {
  const [panes, setPanes] = useState(initialData?.panes || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()
  const pollIntervalRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Calculate scale to fit screen
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const scaleX = containerRect.width / PORTRAIT_WIDTH
      const scaleY = containerRect.height / PORTRAIT_HEIGHT
      const newScale = Math.min(scaleX, scaleY)

      setScale(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // Poll for updates every 5 seconds
  useEffect(() => {
    const pollData = async () => {
      try {
        const res = await fetch('/api/messages')
        const data = await res.json()
        const newPanes = data.panes || []
        setPanes(newPanes)

        // Reset index if current index is out of bounds
        if (newPanes.length > 0 && currentIndex >= newPanes.length) {
          setCurrentIndex(0)
        }
      } catch (error) {
        console.error('Failed to load panes')
      }
    }

    // Start polling
    pollIntervalRef.current = setInterval(pollData, 5000)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [currentIndex])

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
      <div
        ref={containerRef}
        className="relative w-full h-screen bg-black"
        style={{ overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${PORTRAIT_WIDTH}px`,
            height: `${PORTRAIT_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          className="flex items-center justify-center text-white"
        >
          <div className="text-center p-8">
            <h1 className="text-4xl font-bold mb-4">No messages to display</h1>
            <p className="text-xl opacity-80">Please add messages in the admin panel</p>
          </div>
        </div>
      </div>
    )
  }

  const currentPane = panes[currentIndex]
  const backgroundStyle = currentPane?.background?.type === 'image'
    ? { backgroundImage: `url(${currentPane.background.value})` }
    : { backgroundColor: currentPane?.background?.value || '#ffffff' }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen"
      style={{ overflow: 'hidden' }}
    >
      <ConnectionStatus />

      {/* Fixed-size content that gets scaled - matches Preview exactly */}
      <div
        style={{
          width: `${PORTRAIT_WIDTH}px`,
          height: `${PORTRAIT_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          ...backgroundStyle
        }}
        className={`flex flex-col transition-opacity duration-1000 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {currentPane?.title && (
          <div className="bg-black/70 backdrop-blur-sm p-8 text-center">
            <h1 className="text-4xl font-bold text-white">{currentPane.title}</h1>
          </div>
        )}

        {/* Content container - matches Preview exactly */}
        <div className="flex-1 min-h-0 p-8">
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl h-full flex flex-col overflow-hidden ql-snow">
            <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
              <div className="w-full max-w-full">
                <div
                  className="ql-editor"
                  dangerouslySetInnerHTML={{ __html: currentPane?.content?.html || '' }}
                />
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
    </div>
  )
}