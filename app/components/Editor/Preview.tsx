'use client'

import { useState } from 'react'

export function Preview({ pane }) {
  const [aspect, setAspect] = useState<'portrait' | 'landscape'>('portrait')

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

      {/* This outer box provides the dark phone/display frame */}
      <div className={`bg-gray-900 rounded-lg p-4`}>
        {/* This box sets the aspect ratio (9:16 or 16:9) */}
        <div 
          className={`w-full rounded overflow-hidden relative flex flex-col ${
            aspect === 'portrait' ? 'aspect-[9/16]' : 'aspect-video'
          }`}
          style={backgroundStyle}
        >
          {pane?.title && (
            <div className="bg-black/70 backdrop-blur p-4 text-center">
              <h1 className="text-2xl font-bold text-white">{pane.title}</h1>
            </div>
          )}
          
          {/* This container takes the remaining space and provides padding */}
          <div className="p-4 flex-1 min-h-0">
            {/* This inner box provides the styling and hides overflow */}
            <div className="bg-white/95 backdrop-blur rounded h-full overflow-hidden flex flex-col ql-snow">
              {/* This is the new viewport, we measure this. */}
              <div
                className="flex-1 p-3 overflow-y-auto overflow-x-hidden"
              >
                {/* Content container - fully responsive, never exceeds viewport */}
                <div className="w-full max-w-full">
                  {/* 2. We use ql-editor to get 1:1 styles */}
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
  )
}