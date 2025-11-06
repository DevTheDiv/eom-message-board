'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { WordImport } from '../Editor/WordImport'
import { Preview } from '../Editor/Preview'
import { X } from 'lucide-react'
// Import *only the type* for ReactQuill to prevent server-side errors
import type ReactQuill from 'react-quill'

const RichTextEditor = dynamic(() => import('../Editor/RichTextEditor'), { ssr: false })

export function PaneEditor({ pane, onSave, onClose }) {
  const [editedPane, setEditedPane] = useState(pane)
  
  const quillRef = useRef<ReactQuill>(null)
  // Ref to track if the change originated from Quill itself
  const isQuillChange = useRef(false); 

  // Function to convert HTML to Quill's Delta format
  const convertHtmlToDelta = useCallback((html) => {
    // We only run this on the client, where quillRef is available
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor) {
          // Get the Quill constructor from the *editor instance*
          const Quill = editor.constructor; 
          
          // We are now safe to use `document` and `Quill`
          const tempQuill = new Quill(document.createElement('div'));
          tempQuill.clipboard.dangerouslyPasteHTML(0, html);
          return tempQuill.getContents();
      }
    }
    return null;
  }, []); // No external dependencies


  const forceUpdateStateFromEditor = () => {
    if (quillRef.current && typeof quillRef.current.getEditor === 'function') {
      const editor = quillRef.current.getEditor()
      const liveHtml = editor.root.innerHTML
      
      setEditedPane(prev => {
        if (prev.content?.html === liveHtml) {
          return prev
        }
        return {
          ...prev,
          content: { html: liveHtml, type: 'html' }
        }
      })
    }
  }

  const handleSave = () => {
    if (quillRef.current && typeof quillRef.current.getEditor === 'function') {
      const liveHtml = quillRef.current.getEditor().root.innerHTML;
      
      const finalPaneToSave = {
        ...editedPane,
        content: {
          html: liveHtml,
          type: 'html'
        }
      };
      onSave(finalPaneToSave);
    } else {
      onSave(editedPane);
    }
  }

  const handleContentChange = (newHtml: string) => {
    // Set flag that this change is from Quill
    isQuillChange.current = true; 
    setEditedPane(prev => {
      if (prev.content?.html === newHtml) {
        return prev
      }
      return {
        ...prev,
        content: { html: newHtml, type: 'html' }
      }
    })
  }

  // EFFECT TO SYNCHRONIZE QUILL WITH REACT STATE FOR ALIGNMENT/IMAGES
  useEffect(() => {
    if (quillRef.current && editedPane.content?.html && !isQuillChange.current) {
        const editor = quillRef.current.getEditor();
        const currentEditorHtml = editor.root.innerHTML;

        // Only update Quill if the HTML from state is different
        // and the change did NOT originate from Quill itself (to prevent loop)
        if (currentEditorHtml !== editedPane.content.html) {
            const delta = convertHtmlToDelta(editedPane.content.html);
            if (delta) {
                // Use setContents to update Quill's internal state.
                // 'silent' prevents onChange from firing again immediately.
                editor.setContents(delta, 'silent');
            }
        }
    }
    // Reset flag after render cycle
    isQuillChange.current = false; 
  }, [editedPane.content?.html, convertHtmlToDelta]); // Re-run when HTML content changes


  // This listener now catches 'mouseup' AND 'click' for preview updates.
  useEffect(() => {
    const handleDocumentActivity = () => {
      setTimeout(forceUpdateStateFromEditor, 100) // Small delay to let Quill apply style changes
    }
    
    document.addEventListener('mouseup', handleDocumentActivity)
    document.addEventListener('click', handleDocumentActivity)
    
    return () => {
      document.removeEventListener('mouseup', handleDocumentActivity)
      document.removeEventListener('click', handleDocumentActivity)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
      <div className="min-h-screen p-6">
        <div className="bg-white rounded-xl shadow-xl max-w-7xl mx-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold">{pane.id ? 'Edit Pane' : 'New Pane'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editedPane.title || ''}
                  onChange={(e) => setEditedPane({...editedPane, title: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter pane title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={editedPane.duration || 10}
                  onChange={(e) => setEditedPane({...editedPane, duration: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                  max="300"
                />
              </div>

              <WordImport onImport={(html) => {
                setEditedPane({
                  ...editedPane,
                  content: { html, type: 'html' }
                });
              }} />

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <RichTextEditor
                  ref={quillRef}
                  value={editedPane.content?.html || ''}
                  onChange={handleContentChange}
                />
              </div>
            </div>

            <div>
              <Preview pane={editedPane} />
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Save Pane
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}