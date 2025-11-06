import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const DATA_FILE = path.join(process.cwd(), 'data', 'messages.json')

export interface Pane {
  id: string
  title: string
  content: {
    html: string
    type: string
  }
  duration: number
  background: {
    type: 'color' | 'image'
    value: string
  }
  order: number
  createdAt: string
  updatedAt: string
}

export interface MessageData {
  panes: Pane[]
  globalSettings: {
    defaultScale: number
    transition: string
    transitionDuration: number
  }
  lastUpdated: string
}

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE)
  } catch {
    const initialData: MessageData = {
      panes: [{
        id: uuidv4(),
        title: 'Welcome',
        content: {
          html: '<h1>Welcome to Message Board</h1><p>Use the admin panel to create messages.</p>',
          type: 'html'
        },
        duration: 10,
        background: { type: 'color', value: '#ffffff' },
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }],
      globalSettings: {
        defaultScale: 100,
        transition: 'fade',
        transitionDuration: 1000
      },
      lastUpdated: new Date().toISOString()
    }
    
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2))
  }
}

export async function getMessages(): Promise<MessageData> {
  await ensureDataFile()
  const data = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(data)
}

export async function saveMessages(data: MessageData): Promise<void> {
  data.lastUpdated = new Date().toISOString()
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function createPane(pane: Partial<Pane>): Promise<Pane> {
  const data = await getMessages()
  const newPane: Pane = {
    id: uuidv4(),
    title: pane.title || '',
    content: pane.content || { html: '', type: 'html' },
    duration: pane.duration || 10,
    background: pane.background || { type: 'color', value: '#ffffff' },
    order: data.panes.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  data.panes.push(newPane)
  await saveMessages(data)
  return newPane
}

export async function updatePane(id: string, updates: Partial<Pane>): Promise<Pane | null> {
  const data = await getMessages()
  const index = data.panes.findIndex(p => p.id === id)
  
  if (index === -1) return null
  
  data.panes[index] = {
    ...data.panes[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  await saveMessages(data)
  return data.panes[index]
}

export async function deletePane(id: string): Promise<boolean> {
  const data = await getMessages()
  const index = data.panes.findIndex(p => p.id === id)
  
  if (index === -1) return false
  
  data.panes.splice(index, 1)
  data.panes.forEach((pane, i) => { pane.order = i })
  
  await saveMessages(data)
  return true
}
