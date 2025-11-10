'use client'

import { useState, useEffect } from 'react'
import { PaneList } from '../components/Admin/PaneList'
import { PaneEditor } from '../components/Admin/PaneEditor'
import { SettingsPanel } from '../components/Admin/SettingsPanel'
import { toast } from 'sonner'
import { Plus, Settings, Eye } from 'lucide-react'

export default function AdminPage() {
  const [panes, setPanes] = useState<any[]>([])
  const [selectedPane, setSelectedPane] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadPanes()
  }, [])

  const loadPanes = async () => {
    try {
      const res = await fetch('/api/messages')
      const data = await res.json()
      setPanes(data.panes || [])
    } catch (error) {
      toast.error('Failed to load panes')
    }
  }

  const handleCreatePane = () => {
    setSelectedPane({
      title: '',
      content: { html: '<p>Enter your message here...</p>', type: 'html' },
      duration: 10,
      background: { type: 'color', value: '#ffffff' }
    })
    setIsEditing(true)
  }

  const handleEditPane = (pane: any) => {
    setSelectedPane(pane)
    setIsEditing(true)
  }

  const handleSavePane = async (pane: any) => {
    try {
      const url = pane.id ? `/api/messages/${pane.id}` : '/api/messages'
      const method = pane.id ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pane)
      })
      
      if (res.ok) {
        toast.success('Pane saved successfully')
        loadPanes()
        setIsEditing(false)
        setSelectedPane(null)
      }
    } catch (error) {
      toast.error('Failed to save pane')
    }
  }

  const handleDeletePane = async (id: string) => {
    if (!confirm('Delete this pane?')) return

    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Pane deleted')
        loadPanes()
      }
    } catch (error) {
      toast.error('Failed to delete pane')
    }
  }

  const handleReorder = async (paneIds: string[]) => {
    try {
      await fetch('/api/messages/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paneIds })
      })
      loadPanes()
    } catch (error) {
      toast.error('Failed to reorder panes')
    }
  }

  return (
    <div className="p-6">
      <header className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">📋 Message Board Admin</h1>
          <div className="flex gap-3">
            <a href="/" target="_blank" className="btn btn-secondary">
              <Eye className="w-4 h-4 mr-2" />
              View Display
            </a>
            <button onClick={() => setShowSettings(true)} className="btn btn-secondary">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
            <button onClick={handleCreatePane} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Pane
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {isEditing && selectedPane && (
        <PaneEditor
          pane={selectedPane}
          onSave={handleSavePane}
          onClose={() => {
            setIsEditing(false)
            setSelectedPane(null)
          }}
        />
      )}

      <PaneList
        panes={panes}
        onEdit={handleEditPane}
        onDelete={handleDeletePane}
        onReorder={handleReorder}
      />
    </div>
  )
}
