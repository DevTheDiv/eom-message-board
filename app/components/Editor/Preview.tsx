'use client'

import { useState, useRef, useEffect } from 'react'

// Fixed render dimensions - this is the "king" size that everything renders at
const PORTRAIT_WIDTH = 1080
const PORTRAIT_HEIGHT = 1920
const LANDSCAPE_WIDTH = 1920
const LANDSCAPE_HEIGHT = 1080

export function Preview({ pane }) {
  const [aspect, setAspect] = useState<'portrait' | 'landscape'>('portrait')
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const isPortrait = aspect === 'portrait'
  const fixedWidth = isPortrait ? PORTRAIT_WIDTH : LANDSCAPE_WIDTH
  const fixedHeight = isPortrait ? PORTRAIT_HEIGHT : LANDSCAPE_HEIGHT

  // Calculate scale to fit container
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const scaleX = containerRect.width / fixedWidth
      const scaleY = containerRect.height / fixedHeight
      const newScale = Math.min(scaleX, scaleY)

      setScale(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [fixedWidth, fixedHeight])

  const backgroundStyle = pane?.background?.type === 'image'
    ? { backgroundImage: `url(${pane.background.value})` }
    : { backgroundColor: pane?.background?.value || '#ffffff' }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Preview</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setAspect('portrait')}
            className={`px-3 py-1 rounded ${aspect === 'portrait' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Portrait (9:16)
          </button>
          <button
            onClick={() => setAspect('landscape')}
            className={`px-3 py-1 rounded ${aspect === 'landscape' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Landscape (16:9)
          </button>
        </div>
      </div>

      {/* Container that defines available space */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div
          ref={containerRef}
          className={`w-full ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'} relative`}
          style={{ overflow: 'hidden' }}
        >
          {/* Fixed-size content that gets scaled */}
          <div
            style={{
              width: `${fixedWidth}px`,
              height: `${fixedHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              ...backgroundStyle
            }}
            className="flex flex-col"
          >
            {pane?.title && (
              <div className="bg-black/70 backdrop-blur-sm p-8 text-center">
                <h1 className="text-4xl font-bold text-white">{pane.title}</h1>
              </div>
            )}

            {/* Content container */}
            <div className="flex-1 min-h-0 p-8">
              <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl h-full flex flex-col overflow-hidden ql-snow">
                <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
                  <div className="w-full max-w-full">
                    <div
                      className="ql-editor"
                      dangerouslySetInnerHTML={{ __html: pane?.content?.html || '' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}