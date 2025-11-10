'use client'

import { useState, useRef, useEffect } from 'react'

// Fixed render dimensions - this is the "king" size that everything renders at
// Using 540x960 (half of 1080x1920) for comfortable editing - scales up beautifully on display
const PORTRAIT_WIDTH = 540
const PORTRAIT_HEIGHT = 960
const LANDSCAPE_WIDTH = 960
const LANDSCAPE_HEIGHT = 540

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
          className={`w-full ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'} relative flex items-center justify-center`}
          style={{ overflow: 'hidden' }}
        >
          {/* Fixed-size content that gets scaled */}
          <div
            style={{
              width: `${fixedWidth}px`,
              height: `${fixedHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              ...backgroundStyle
            }}
            className="flex flex-col"
          >
            {pane?.title && (
              <div className="bg-black/70 backdrop-blur-sm p-4 text-center">
                <h1 className="text-2xl font-bold text-white">{pane.title}</h1>
              </div>
            )}

            {/* Content container */}
            <div className="flex-1 min-h-0 p-4">
              <div className="h-full flex flex-col overflow-hidden ql-snow">
                <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
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