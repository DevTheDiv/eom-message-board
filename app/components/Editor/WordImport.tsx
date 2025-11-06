'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { FileText, Upload } from 'lucide-react'
// No longer need docx-preview
// import { renderAsync } from 'docx-preview'

export function WordImport({ onImport }: { onImport: (html: string) => void }) {
  const [isPasting, setIsPasting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    
    if (html || text) {
      onImport(html || `<p>${text}</p>`)
      toast.success('Content pasted successfully')
      setIsPasting(false)
    }
  }

  // === START OF FIX ===
  // This function is now updated to call the server-side API route
  // which uses 'mammoth' to properly extract images.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Create FormData to send the file to the API
    const formData = new FormData()
    formData.append('document', file)

    try {
      // 2. Call the backend API route
      const res = await fetch('/api/upload/docx', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        // 3. Pass the HTML (now with base64 images) to the editor
        onImport(data.html)
        toast.success('Document imported successfully')
        if (data.messages && data.messages.length > 0) {
          toast.info(`Import messages: ${data.messages.join(', ')}`)
        }
      } else {
        throw new Error(data.error || 'Failed to convert document')
      }

    } catch (error) {
      console.error('Docx import failed:', error)
      toast.error(error.message)
    } finally {
      // 4. Clean up the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  // === END OF FIX ===

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-blue-600" />
        <span className="font-medium">Import from Word</span>
      </div>

      {isPasting ? (
        <div
          className="min-h-[100px] p-3 bg-white rounded border cursor-text"
          contentEditable
          onPaste={handlePaste}
        >
          <span className="text-gray-400">Paste your Word content here...</span>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => setIsPasting(true)}
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            📋 Paste Content
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload .docx
          </button>
        </div>
      )}
    </div>
  )
}