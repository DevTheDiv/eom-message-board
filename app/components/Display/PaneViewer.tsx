'use client'

import { useState, useEffect, useRef } from 'react'
import { ConnectionStatus } from './ConnectionStatus'

// Fixed render dimensions - matches Preview.tsx (the "king")
// Using 540x960 for comfortable editing - scales up beautifully on display
const PORTRAIT_WIDTH = 540
const PORTRAIT_HEIGHT = 960

export default function DisplayBoard({ initialData }: { initialData: any }) {
  const [panes, setPanes] = useState(initialData?.panes || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()
  const pollIntervalRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Calculate scale to fill entire screen (not maintaining aspect ratio container)
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return

      // Use window dimensions to fill entire screen
      const scaleX = window.innerWidth / PORTRAIT_WIDTH
      const scaleY = window.innerHeight / PORTRAIT_HEIGHT
      // Use min to maintain aspect ratio while filling screen
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

        // Only update panes if they've actually changed
        if (JSON.stringify(newPanes) !== JSON.stringify(panes)) {
          setPanes(newPanes)
        }

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
  }, [currentIndex, panes])

  // Handle pane rotation
  useEffect(() => {
    if (panes.length === 0) return
    if (panes.length === 1) return // No need to rotate if only one pane

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Get duration for current pane
    const duration = (panes[currentIndex]?.duration || 10) * 1000

    // Set timer to transition to next pane
    timerRef.current = setTimeout(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % panes.length
          console.log(`Transitioning from pane ${prev} to ${nextIndex}`)
          return nextIndex
        })
        setIsTransitioning(false)
      }, 500)
    }, duration)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [currentIndex, panes.length])

  const loadData = async () => {
    try {
      const res = await fetch('/api/messages')
      const data = await res.json()
      setPanes(data.panes || [])
    } catch (error) {
      console.error('Failed to load panes')
    }
  }

  if (panes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-screen bg-black flex items-center justify-center"
        style={{ overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${PORTRAIT_WIDTH}px`,
            height: `${PORTRAIT_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="flex items-center justify-center text-white"
        >
          <div className="text-center p-4">
            <h1 className="text-2xl font-bold mb-2">No messages to display</h1>
            <p className="text-base opacity-80">Please add messages in the admin panel</p>
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
      className="relative w-full h-screen flex items-center justify-center"
      style={{ overflow: 'hidden' }}
    >
      <ConnectionStatus />

      {/* Fixed-size content that gets scaled - matches Preview exactly */}
      <div
        style={{
          width: `${PORTRAIT_WIDTH}px`,
          height: `${PORTRAIT_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          ...backgroundStyle
        }}
        className={`flex flex-col transition-opacity duration-1000 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {currentPane?.title && (
          <div className="bg-black/70 backdrop-blur-sm p-4 text-center">
            <h1 className="text-2xl font-bold text-white">{currentPane.title}</h1>
          </div>
        )}

        {/* Content container - matches Preview exactly */}
        <div className="flex-1 min-h-0 p-4">
          <div className="h-full flex flex-col overflow-hidden ql-snow">
            <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {panes.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
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