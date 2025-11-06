'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'

export function SettingsPanel({ onClose }) {
  const [settings, setSettings] = useState({
    defaultScale: 100,
    transition: 'fade',
    transitionDuration: 1000
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      toast.error('Failed to load settings')
    }
  }

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (res.ok) {
        toast.success('Settings saved')
        onClose()
      }
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Global Settings</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Default Scale (%)</label>
          <input
            type="range"
            min="50"
            max="200"
            value={settings.defaultScale}
            onChange={(e) => setSettings({...settings, defaultScale: parseInt(e.target.value)})}
            className="w-full"
          />
          <span className="text-sm text-gray-500">{settings.defaultScale}%</span>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Transition Type</label>
          <select
            value={settings.transition}
            onChange={(e) => setSettings({...settings, transition: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="zoom">Zoom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Transition Duration (ms)</label>
          <input
            type="number"
            value={settings.transitionDuration}
            onChange={(e) => setSettings({...settings, transitionDuration: parseInt(e.target.value)})}
            className="w-full px-4 py-2 border rounded-lg"
            min="100"
            max="5000"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={saveSettings} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Save Settings
          </button>
          <button onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
